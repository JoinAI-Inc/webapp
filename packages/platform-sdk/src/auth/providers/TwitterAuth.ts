import { OAuthProviderBase } from './OAuthProviderBase.js';
import { Config } from '../../core/config.js';

export class TwitterAuth extends OAuthProviderBase {
    private static readonly AUTH_ENDPOINT = 'https://twitter.com/i/oauth2/authorize';
    private static readonly SCOPES = ['tweet.read', 'users.read'];

    constructor(config: Config) {
        super(config, 'twitter');
    }

    getAuthorizationUrl(): string {
        const clientId = this.config.getOAuthClientId('twitter');
        const redirectUri = this.config.getCallbackUrl();
        const state = this.generateState();

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: TwitterAuth.SCOPES.join(' '),
            state: state,
            code_challenge: 'challenge', // Twitter需要PKCE
            code_challenge_method: 'plain',
        });

        return `${TwitterAuth.AUTH_ENDPOINT}?${params.toString()}`;
    }
}
