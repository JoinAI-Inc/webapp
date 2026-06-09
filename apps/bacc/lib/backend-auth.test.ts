import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { syncBackendIdentity } from './backend-auth.js';

describe('syncBackendIdentity', () => {
    it('repairs a session that is missing its backend user identity', async () => {
        const requests: Array<{ url: string; body: any }> = [];
        const token: any = {
            sub: 'google-user-123',
            email: 'person@example.com',
            name: 'Person',
            picture: 'https://example.com/avatar.png',
        };

        const result = await syncBackendIdentity(token, {
            apiBackendUrl: 'http://api:3001',
            fetchImpl: async (url, init) => {
                requests.push({
                    url: String(url),
                    body: JSON.parse(String(init?.body)),
                });
                return Response.json({
                    token: 'backend-jwt',
                    user: { id: 'database-user-456' },
                });
            },
        });

        assert.equal(requests.length, 1);
        assert.equal(requests[0].url, 'http://api:3001/api/auth/nextauth/callback');
        assert.deepEqual(requests[0].body, {
            provider: 'google',
            providerAccountId: 'google-user-123',
            email: 'person@example.com',
            name: 'Person',
            image: 'https://example.com/avatar.png',
        });
        assert.equal(result.backendJwt, 'backend-jwt');
        assert.equal(result.userId, 'database-user-456');
    });
});
