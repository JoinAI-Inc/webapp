import { SDKConfig } from '../types/index.js';

export class Config {
    public readonly apiBaseUrl: string;
    public readonly appId?: string;
    public readonly oauth?: SDKConfig['oauth'];
    public readonly callbackUrl?: string;

    constructor(config: SDKConfig) {
        if (!config.apiBaseUrl) {
            throw new Error('apiBaseUrl is required');
        }

        this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.appId = config.appId;
        this.oauth = config.oauth;
        this.callbackUrl = config.callbackUrl;
    }

    getOAuthClientId(provider: 'google' | 'apple' | 'discord' | 'twitter'): string {
        const clientId = this.oauth?.[provider]?.clientId;
        if (!clientId) {
            throw new Error(`OAuth client ID for ${provider} is not configured`);
        }
        return clientId;
    }

    getCallbackUrl(): string {
        if (!this.callbackUrl) {
            if (typeof window !== 'undefined') {
                return `${window.location.origin}/auth/callback`;
            }
            throw new Error('callbackUrl is not configured and cannot be auto-detected');
        }
        return this.callbackUrl;
    }
}
