import { OAuthProviderBase } from './OAuthProviderBase.js';
import { Config } from '../../core/config.js';

export class DiscordAuth extends OAuthProviderBase {
    private static readonly AUTH_ENDPOINT = 'https://discord.com/api/oauth2/authorize';
    private static readonly SCOPES = ['identify', 'email'];

    constructor(config: Config) {
        super(config, 'discord');
    }

    getAuthorizationUrl(): string {
        const clientId = this.config.getOAuthClientId('discord');
        const redirectUri = this.config.getCallbackUrl();
        const randomState = this.generateState();

        // 将 provider 信息编码到 state 参数中
        const state = `discord.${randomState}`;

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: DiscordAuth.SCOPES.join(' '),
            state: state,
        });

        return `${DiscordAuth.AUTH_ENDPOINT}?${params.toString()}`;
    }
}
