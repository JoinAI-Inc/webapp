import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMessageCreateData } from './messages.js';

describe('buildMessageCreateData', () => {
    it('builds an anonymous message without a user relation', () => {
        const data = buildMessageCreateData({
            content: '  hello from about  ',
            ipAddress: '203.0.113.10',
            userAgent: 'UnitTest/1.0',
        });

        assert.equal(data.content, 'hello from about');
        assert.equal(data.ipAddress, '203.0.113.10');
        assert.equal(data.userAgent, 'UnitTest/1.0');
        assert.equal('userId' in data, false);
        assert.equal(data.userEmail, null);
        assert.equal(data.userName, null);
        assert.equal(data.userImage, null);
    });

    it('builds an authenticated message with user relation and snapshot', () => {
        const data = buildMessageCreateData({
            content: 'signed in feedback',
            ipAddress: '198.51.100.20',
            userAgent: 'UnitTest/2.0',
            user: {
                id: 'user_123',
                email: 'person@example.com',
                name: 'Person',
                image: 'https://example.com/avatar.png',
            },
        });

        assert.equal(data.content, 'signed in feedback');
        assert.equal(data.userId, 'user_123');
        assert.equal(data.userEmail, 'person@example.com');
        assert.equal(data.userName, 'Person');
        assert.equal(data.userImage, 'https://example.com/avatar.png');
    });
});
