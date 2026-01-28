import { APIClient } from '../api/client.js';
import { Config } from '../core/config.js';
import { Storage } from '../core/storage.js';
import { OAuthProvider, User, AuthResult, AuthValidationResult, AuthStateChangeCallback } from '../types/index.js';
import { GoogleAuth } from './providers/GoogleAuth.js';
import { AppleAuth } from './providers/AppleAuth.js';
import { DiscordAuth } from './providers/DiscordAuth.js';
import { TwitterAuth } from './providers/TwitterAuth.js';
import { OAuthProviderBase } from './providers/OAuthProviderBase.js';

export class AuthManager {
    private config: Config;
    private storage: Storage;
    private apiClient: APIClient;
    private providers: Map<OAuthProvider, OAuthProviderBase>;
    private authStateChangeCallbacks: Set<AuthStateChangeCallback>;
    private validationTimer?: number;

    constructor(config: Config, storage: Storage, apiClient: APIClient) {
        this.config = config;
        this.storage = storage;
        this.apiClient = apiClient;
        this.providers = new Map();
        this.authStateChangeCallbacks = new Set();

        // 初始化OAuth提供商
        this.initializeProviders();
    }

    private initializeProviders(): void {
        try {
            if (this.config.oauth?.google) {
                this.providers.set('google', new GoogleAuth(this.config));
            }
        } catch (e) {
            // Google未配置，跳过
        }

        try {
            if (this.config.oauth?.apple) {
                this.providers.set('apple', new AppleAuth(this.config));
            }
        } catch (e) {
            // Apple未配置，跳过
        }

        try {
            if (this.config.oauth?.discord) {
                this.providers.set('discord', new DiscordAuth(this.config));
            }
        } catch (e) {
            // Discord未配置，跳过
        }

        try {
            if (this.config.oauth?.twitter) {
                this.providers.set('twitter', new TwitterAuth(this.config));
            }
        } catch (e) {
            // Twitter未配置，跳过
        }
    }

    /**
     * 启动第三方登录流程
     * @param provider OAuth提供商
     */
    login(provider: OAuthProvider): void {
        const oauthProvider = this.providers.get(provider);
        if (!oauthProvider) {
            throw new Error(`OAuth provider "${provider}" is not configured`);
        }

        if (typeof window === 'undefined') {
            throw new Error('login() can only be called in browser environment');
        }

        const authUrl = oauthProvider.getAuthorizationUrl();

        // 保存状态用于验证
        // state格式: provider.randomState，只保存randomState部分
        const url = new URL(authUrl);
        const fullState = url.searchParams.get('state');
        if (fullState) {
            const randomState = fullState.split('.')[1];
            if (randomState) {
                this.storage.setOAuthState(randomState);
            }
        }

        // 重定向到授权页面
        window.location.href = authUrl;
    }

    /**
     * 处理OAuth回调
     * 从URL中提取code和state，调用后端API完成认证
     */
    async handleCallback(): Promise<AuthResult> {
        if (typeof window === 'undefined') {
            throw new Error('handleCallback() can only be called in browser environment');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const stateParam = urlParams.get('state');

        if (!code) {
            throw new Error('Authorization code not found in callback URL');
        }

        if (!stateParam) {
            throw new Error('State parameter not found in callback URL');
        }

        // 从 state 中提取 provider 和随机值
        // 格式: provider.randomState
        const [provider, state] = stateParam.split('.');

        if (!provider) {
            throw new Error('Provider not found in state parameter');
        }

        // 验证state（CSRF防护）
        const savedState = this.storage.getOAuthState();
        if (state && savedState && state !== savedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // 清除保存的state
        this.storage.removeOAuthState();

        // 调用后端API，用code换取token和用户信息
        const result = await this.apiClient.post<AuthResult>(
            `/auth/${provider}/callback`,
            { code }
        );

        if (result.success) {
            // 保存认证信息
            this.storage.setToken(result.token);
            this.storage.setUser(result.user);
        }

        return result;
    }

    /**
     * 检查用户是否已登录
     */
    isAuthenticated(): boolean {
        return !!this.storage.getToken();
    }

    /**
     * 获取当前登录用户
     */
    getCurrentUser(): User | null {
        return this.storage.getUser();
    }

    /**
     * 登出
     */
    logout(): void {
        this.storage.clear();
    }

    /**
     * 获取当前token
     */
    getToken(): string | null {
        return this.storage.getToken();
    }

    /**
     * 验证当前token是否有效
     */
    async validateAuth(): Promise<AuthValidationResult> {
        const token = this.storage.getToken();

        if (!token) {
            const result = {
                isValid: false,
                error: 'NoToken',
                message: 'No authentication token found'
            };
            this.notifyAuthStateChange(result);
            return result;
        }

        try {
            const response = await this.apiClient.get<AuthValidationResult>('/auth/validate');

            if (response.isValid && response.user) {
                // 更新本地用户信息
                this.storage.setUser(response.user);
            } else {
                // Token无效,清除本地数据
                this.storage.clear();
            }

            this.notifyAuthStateChange(response);
            return response;
        } catch (error: any) {
            const result = {
                isValid: false,
                error: 'ValidationFailed',
                message: error.message || 'Failed to validate authentication'
            };

            // 验证失败，清除本地数据
            this.storage.clear();
            this.notifyAuthStateChange(result);

            return result;
        }
    }

    /**
     * 刷新token
     */
    async refreshToken(): Promise<void> {
        try {
            const response = await this.apiClient.post<{ success: boolean; token: string }>('/auth/refresh');

            if (response.success && response.token) {
                this.storage.setToken(response.token);
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
            throw error;
        }
    }

    /**
     * 添加认证状态变更监听器
     */
    onAuthStateChange(callback: AuthStateChangeCallback): () => void {
        this.authStateChangeCallbacks.add(callback);

        // 返回取消订阅函数
        return () => {
            this.authStateChangeCallbacks.delete(callback);
        };
    }

    /**
     * 启动自动校验
     */
    startAutoValidation(interval: number = 5 * 60 * 1000): void {
        // 清除现有定时器
        this.stopAutoValidation();

        // 立即执行一次校验
        this.validateAuth();

        // 设置定时校验
        if (typeof window !== 'undefined') {
            this.validationTimer = window.setInterval(() => {
                this.validateAuth();
            }, interval);
        }
    }

    /**
     * 停止自动校验
     */
    stopAutoValidation(): void {
        if (this.validationTimer && typeof window !== 'undefined') {
            window.clearInterval(this.validationTimer);
            this.validationTimer = undefined;
        }
    }

    /**
     * 通知所有监听器认证状态变更
     */
    private notifyAuthStateChange(result: AuthValidationResult): void {
        this.authStateChangeCallbacks.forEach(callback => {
            try {
                callback(result);
            } catch (error) {
                console.error('Error in auth state change callback:', error);
            }
        });
    }
}
