import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';

process.env.WORKER_SECRET = 'unit-test-internal-secret';

const { authenticateJWTOrInternal } = await import('./auth.js');

function makeSignedHeaders(userId: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', process.env.WORKER_SECRET!)
        .update(`${userId}:${timestamp}`)
        .digest('hex');

    return {
        'x-internal-user-id': userId,
        'x-internal-timestamp': timestamp,
        'x-internal-signature': signature,
    };
}

function makeMockResponse() {
    const response: any = {
        statusCode: 200,
        body: undefined,
        status(code: number) {
            response.statusCode = code;
            return response;
        },
        json(body: unknown) {
            response.body = body;
            return response;
        },
    };
    return response;
}

describe('authenticateJWTOrInternal', () => {
    it('accepts a valid internal signed request', () => {
        const req: any = { headers: makeSignedHeaders('user_123') };
        const res = makeMockResponse();
        let nextCalled = false;

        authenticateJWTOrInternal(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, true);
        assert.equal(req.userId, 'user_123');
        assert.equal(res.statusCode, 200);
    });
});
