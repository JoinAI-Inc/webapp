import { OAuthProviderBase } from './OAuthProviderBase.js';
import { Config } from '../../core/config.js';

export class AppleAuth extends OAuthProviderBase {
    private static readonly AUTH_ENDPOINT = 'https://appleid.apple.com/auth/authorize';
    private static readonly SCOPES = ['name', 'email'];

    constructor(config: Config) {
        super(config, 'apple');
    }

    getAuthorizationUrl(): string {
        const clientId = this.config.getOAuthClientId('apple');
        const redirectUri = this.config.getCallbackUrl();
        const state = this.generateState();

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: AppleAuth.SCOPES.join(' '),
            state: state,
            response_mode: 'form_post', // Apple推荐使用form_post
        });

        return `${AppleAuth.AUTH_ENDPOINT}?${params.toString()}`;
    }
}
