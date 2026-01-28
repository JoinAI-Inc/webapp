import { User } from '../types/index.js';

const STORAGE_PREFIX = 'platform_sdk_';

export class Storage {
    private prefix: string;

    constructor(prefix: string = STORAGE_PREFIX) {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    // Token管理
    setToken(token: string): void {
        if (typeof window !== 'undefined') {
            // 保存到 localStorage（用于客户端访问）
            localStorage.setItem(this.getKey('token'), token);

            // 同时保存到 cookie（用于服务端中间件验证）
            // 设置 7 天过期，path=/ 确保全站可用
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);
            document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        }
    }

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.getKey('token'));
    }

    removeToken(): void {
        if (typeof window !== 'undefined') {
            // 从 localStorage 删除
            localStorage.removeItem(this.getKey('token'));

            // 从 cookie 删除（设置过期时间为过去）
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
        }
    }

    // 用户信息管理
    setUser(user: User): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.getKey('user'), JSON.stringify(user));
        }
    }

    getUser(): User | null {
        if (typeof window === 'undefined') return null;

        const userStr = localStorage.getItem(this.getKey('user'));
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Failed to parse user data:', error);
            this.removeUser();
            return null;
        }
    }

    removeUser(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.getKey('user'));
        }
    }

    // OAuth状态管理（用于CSRF防护）
    setOAuthState(state: string): void {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(this.getKey('oauth_state'), state);
        }
    }

    getOAuthState(): string | null {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(this.getKey('oauth_state'));
    }

    removeOAuthState(): void {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(this.getKey('oauth_state'));
        }
    }

    // 清除所有数据
    clear(): void {
        this.removeToken();
        this.removeUser();
        this.removeOAuthState();
    }
}
