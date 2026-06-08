import express, { Request, Response } from 'express';
import { verifyInternalRequest } from '../lib/internal-auth.js';
import {
    createMessage,
    findMessageUser,
    getMessageRateLimitCounts,
    getMessageRateLimitDecision,
} from '../services/messages.js';

const router = express.Router();
const MAX_MESSAGE_LENGTH = 2000;

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

function getClientIP(req: Request): string | null {
    const forwarded = firstHeaderValue(req.headers['x-forwarded-for']);
    if (forwarded) return forwarded.split(',')[0]?.trim() || null;

    const realIP = firstHeaderValue(req.headers['x-real-ip']);
    if (realIP) return realIP.trim();

    return req.ip || null;
}

function getInternalUserId(req: Request): { userId: string | null; invalid: boolean } {
    const internalUserId = firstHeaderValue(req.headers['x-internal-user-id']);
    const timestamp = firstHeaderValue(req.headers['x-internal-timestamp']);
    const signature = firstHeaderValue(req.headers['x-internal-signature']);

    if (!internalUserId && !timestamp && !signature) {
        return { userId: null, invalid: false };
    }

    const userId = verifyInternalRequest(internalUserId, timestamp, signature);
    return { userId, invalid: !userId };
}

router.post('/', async (req: Request, res: Response) => {
    try {
        const content = typeof req.body?.content === 'string'
            ? req.body.content.trim()
            : '';

        if (!content) {
            return res.status(400).json({ error: 'Message content is required.' });
        }

        if (content.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: `Message content must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
        }

        const internalAuth = getInternalUserId(req);
        if (internalAuth.invalid) {
            return res.status(401).json({ error: 'Invalid internal authentication.' });
        }

        const user = internalAuth.userId
            ? await findMessageUser(internalAuth.userId)
            : null;

        if (internalAuth.userId && !user) {
            return res.status(401).json({ error: 'Authenticated user not found.' });
        }

        const ipAddress = getClientIP(req);
        const visitorId = typeof req.body?.visitorId === 'string'
            ? req.body.visitorId.trim()
            : null;
        const rateLimitDecision = getMessageRateLimitDecision(
            await getMessageRateLimitCounts({
                userId: user?.id ?? null,
                visitorId,
                ipAddress,
            }),
        );

        if (rateLimitDecision.allowed === false) {
            return res.status(429).json({
                error: 'Message submission limit reached. Please try again later.',
                reason: rateLimitDecision.reason,
            });
        }

        const message = await createMessage({
            content,
            visitorId,
            ipAddress,
            userAgent: firstHeaderValue(req.headers['user-agent']) || null,
            user,
        });

        return res.status(201).json({
            success: true,
            message: {
                id: message.id,
                createdAt: message.createdAt,
            },
        });
    } catch (error: any) {
        console.error('[Message API] Failed to create message:', error);
        return res.status(500).json({ error: error.message || 'Failed to create message' });
    }
});

export default router;
