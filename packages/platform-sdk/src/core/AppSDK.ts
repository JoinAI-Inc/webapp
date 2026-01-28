import { Config } from './config.js';
import { Storage } from './storage.js';
import { APIClient } from '../api/client.js';
import { AuthManager } from '../auth/AuthManager.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';
import {
    SDKConfig,
    AuthValidationResult,
    SubscriptionStatus,
    AuthStateChangeCallback,
    SubscriptionChangeCallback,
} from '../types/index.js';

export class AppSDK {
    public readonly config: Config;
    public readonly auth: AuthManager;
    public readonly subscription: SubscriptionManager;

    private storage: Storage;
    private apiClient: APIClient;

    constructor(sdkConfig: SDKConfig) {
        // 初始化配置
        this.config = new Config(sdkConfig);

        // 初始化存储
        this.storage = new Storage();

        // 初始化API客户端
        this.apiClient = new APIClient(this.config, this.storage);

        // 初始化认证管理器
        this.auth = new AuthManager(this.config, this.storage, this.apiClient);

        // 初始化订阅管理器
        this.subscription = new SubscriptionManager(
            this.config,
            this.storage,
            this.apiClient
        );

        // 设置401处理器
        this.apiClient.setUnauthorizedHandler(() => {
            // 默认行为:清除认证信息并触发校验
            this.auth.logout();
            this.auth.validateAuth().catch(console.error);
        });

        // 启动自动校验(如配置)
        if (sdkConfig.autoValidate?.enabled) {
            const interval = sdkConfig.autoValidate.interval || 5 * 60 * 1000;
            this.auth.startAutoValidation(interval);
        }
    }

    /**
     * 设置未授权处理器
     * 当API返回401时会调用此处理器
     */
    onUnauthorized(handler: () => void): void {
        this.apiClient.setUnauthorizedHandler(handler);
    }

    /**
     * 统一的状态校验入口
     * 同时验证认证状态和订阅状态
     */
    async validateStatus(): Promise<{
        auth: AuthValidationResult;
        subscription: SubscriptionStatus;
    }> {
        const [auth, subscription] = await Promise.all([
            this.auth.validateAuth(),
            this.subscription.validateSubscription(),
        ]);

        return { auth, subscription };
    }

    /**
     * 添加认证状态变更监听器
     * 代理到AuthManager
     */
    onAuthStateChange(callback: AuthStateChangeCallback): () => void {
        return this.auth.onAuthStateChange(callback);
    }

    /**
     * 添加订阅状态变更监听器
     * 代理到SubscriptionManager
     */
    onSubscriptionChange(callback: SubscriptionChangeCallback): () => void {
        return this.subscription.onSubscriptionChange(callback);
    }
}

export default AppSDK;
