import { OAuthProvider } from '../../types/index.js';
import { Config } from '../../core/config.js';

export abstract class OAuthProviderBase {
    protected config: Config;
    protected provider: OAuthProvider;

    constructor(config: Config, provider: OAuthProvider) {
        this.config = config;
        this.provider = provider;
    }

    // 生成随机状态字符串用于CSRF防护
    protected generateState(): string {
        const array = new Uint8Array(16);
        if (typeof window !== 'undefined' && window.crypto) {
            window.crypto.getRandomValues(array);
        }
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    // 获取授权URL
    abstract getAuthorizationUrl(): string;

    // 获取提供商名称
    getProviderName(): OAuthProvider {
        return this.provider;
    }
}
