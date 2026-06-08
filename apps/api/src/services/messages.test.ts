import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    buildMessageCreateData,
    getMessageRateLimitDecision,
    MESSAGE_RATE_LIMITS,
} from './messages.js';

describe('buildMessageCreateData', () => {
    it('builds an anonymous message without a user relation', () => {
        const data = buildMessageCreateData({
            content: '  hello from about  ',
            ipAddress: '203.0.113.10',
            userAgent: 'UnitTest/1.0',
            visitorId: 'visitor_123',
        });

        assert.equal(data.content, 'hello from about');
        assert.equal(data.ipAddress, '203.0.113.10');
        assert.equal(data.userAgent, 'UnitTest/1.0');
        assert.equal(data.visitorId, 'visitor_123');
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

describe('getMessageRateLimitDecision', () => {
    it('allows messages when all counters are under their limits', () => {
        const decision = getMessageRateLimitDecision({
            userDayCount: MESSAGE_RATE_LIMITS.user.day - 1,
            userMinuteCount: MESSAGE_RATE_LIMITS.user.minute - 1,
            visitorDayCount: MESSAGE_RATE_LIMITS.visitor.day - 1,
            ipDayCount: MESSAGE_RATE_LIMITS.ip.day - 1,
        });

        assert.equal(decision.allowed, true);
    });

    it('blocks logged-in users at the daily user limit', () => {
        const decision = getMessageRateLimitDecision({
            userDayCount: MESSAGE_RATE_LIMITS.user.day,
            userMinuteCount: 0,
            visitorDayCount: 0,
            ipDayCount: 0,
        });

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'user_daily_limit');
    });

    it('blocks logged-in users at the per-minute user limit', () => {
        const decision = getMessageRateLimitDecision({
            userDayCount: 0,
            userMinuteCount: MESSAGE_RATE_LIMITS.user.minute,
            visitorDayCount: 0,
            ipDayCount: 0,
        });

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'user_minute_limit');
    });

    it('blocks anonymous visitors at the daily visitor limit', () => {
        const decision = getMessageRateLimitDecision({
            userDayCount: 0,
            userMinuteCount: 0,
            visitorDayCount: MESSAGE_RATE_LIMITS.visitor.day,
            ipDayCount: 0,
        });

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'visitor_daily_limit');
    });

    it('blocks any sender at the daily IP limit', () => {
        const decision = getMessageRateLimitDecision({
            userDayCount: 0,
            userMinuteCount: 0,
            visitorDayCount: 0,
            ipDayCount: MESSAGE_RATE_LIMITS.ip.day,
        });

        assert.equal(decision.allowed, false);
        assert.equal(decision.reason, 'ip_daily_limit');
    });
});
