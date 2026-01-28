import { OAuthProviderBase } from './OAuthProviderBase.js';
import { Config } from '../../core/config.js';

export class GoogleAuth extends OAuthProviderBase {
    private static readonly AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
    private static readonly SCOPES = ['openid', 'email', 'profile'];

    constructor(config: Config) {
        super(config, 'google');
    }

    getAuthorizationUrl(): string {
        const clientId = this.config.getOAuthClientId('google');
        const redirectUri = this.config.getCallbackUrl();
        const randomState = this.generateState();

        // 将 provider 信息编码到 state 参数中：provider.randomState
        const state = `google.${randomState}`;

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: GoogleAuth.SCOPES.join(' '),
            state: state,
            access_type: 'offline',
            prompt: 'consent',
        });

        return `${GoogleAuth.AUTH_ENDPOINT}?${params.toString()}`;
    }
}
