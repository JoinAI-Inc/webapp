export interface BackendIdentityToken {
    sub?: string;
    email?: string | null;
    name?: string | null;
    picture?: string | null;
    backendJwt?: unknown;
    userId?: unknown;
    authProvider?: string;
    authProviderAccountId?: string;
    [key: string]: unknown;
}

interface SyncBackendIdentityOptions {
    apiBackendUrl?: string;
    fetchImpl?: typeof fetch;
}

export async function syncBackendIdentity<T extends BackendIdentityToken>(
    token: T,
    options: SyncBackendIdentityOptions = {},
): Promise<T> {
    if (token.backendJwt && token.userId) {
        return token;
    }

    const apiBackendUrl = options.apiBackendUrl || process.env.API_BACKEND_URL;
    if (!apiBackendUrl) {
        throw new Error('API_BACKEND_URL is not configured');
    }

    const provider = token.authProvider || 'google';
    const providerAccountId = token.authProviderAccountId || token.sub;

    if (!providerAccountId || !token.email) {
        throw new Error('OAuth identity is incomplete');
    }

    const fetchImpl = options.fetchImpl || fetch;
    const response = await fetchImpl(`${apiBackendUrl}/api/auth/nextauth/callback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            provider,
            providerAccountId,
            email: token.email,
            name: token.name,
            image: token.picture,
        }),
    });

    if (!response.ok) {
        throw new Error(`Backend authentication failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.token || !data.user?.id) {
        throw new Error('Backend authentication response is incomplete');
    }

    token.backendJwt = data.token;
    token.userId = data.user.id;
    return token;
}
