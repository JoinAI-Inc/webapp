import { prisma } from '@repo/database';
import type { Message, Prisma, User } from '@prisma/client';

export type MessageUserSnapshot = Pick<User, 'id' | 'email' | 'name' | 'image'>;

export type BuildMessageCreateDataInput = {
    content: string;
    visitorId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    user?: MessageUserSnapshot | null;
};

export const MESSAGE_RATE_LIMITS = {
    user: {
        minute: 1,
        day: 5,
    },
    visitor: {
        day: 3,
    },
    ip: {
        day: 80,
    },
} as const;

export type MessageRateLimitReason =
    | 'user_daily_limit'
    | 'user_minute_limit'
    | 'visitor_daily_limit'
    | 'ip_daily_limit';

export type MessageRateLimitDecision =
    | { allowed: true }
    | { allowed: false; reason: MessageRateLimitReason };

export type MessageRateLimitCounts = {
    userDayCount: number;
    userMinuteCount: number;
    visitorDayCount: number;
    ipDayCount: number;
};

export function buildMessageCreateData({
    content,
    visitorId,
    ipAddress,
    userAgent,
    user,
}: BuildMessageCreateDataInput): Prisma.MessageUncheckedCreateInput {
    const trimmedContent = content.trim();

    return {
        content: trimmedContent,
        ...(user?.id ? { userId: user.id } : {}),
        userEmail: user?.email ?? null,
        userName: user?.name ?? null,
        userImage: user?.image ?? null,
        visitorId: visitorId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
    };
}

export function getMessageRateLimitDecision({
    userDayCount,
    userMinuteCount,
    visitorDayCount,
    ipDayCount,
}: MessageRateLimitCounts): MessageRateLimitDecision {
    if (ipDayCount >= MESSAGE_RATE_LIMITS.ip.day) {
        return { allowed: false, reason: 'ip_daily_limit' };
    }

    if (userMinuteCount >= MESSAGE_RATE_LIMITS.user.minute) {
        return { allowed: false, reason: 'user_minute_limit' };
    }

    if (userDayCount >= MESSAGE_RATE_LIMITS.user.day) {
        return { allowed: false, reason: 'user_daily_limit' };
    }

    if (visitorDayCount >= MESSAGE_RATE_LIMITS.visitor.day) {
        return { allowed: false, reason: 'visitor_daily_limit' };
    }

    return { allowed: true };
}

export async function getMessageRateLimitCounts({
    userId,
    visitorId,
    ipAddress,
    now = new Date(),
}: {
    userId?: string | null;
    visitorId?: string | null;
    ipAddress?: string | null;
    now?: Date;
}): Promise<MessageRateLimitCounts> {
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const minuteAgo = new Date(now.getTime() - 60 * 1000);

    const [userDayCount, userMinuteCount, visitorDayCount, ipDayCount] = await Promise.all([
        userId
            ? prisma.message.count({
                where: { userId, createdAt: { gte: dayAgo } },
            })
            : 0,
        userId
            ? prisma.message.count({
                where: { userId, createdAt: { gte: minuteAgo } },
            })
            : 0,
        !userId && visitorId
            ? prisma.message.count({
                where: { visitorId, createdAt: { gte: dayAgo } },
            })
            : 0,
        ipAddress
            ? prisma.message.count({
                where: { ipAddress, createdAt: { gte: dayAgo } },
            })
            : 0,
    ]);

    return { userDayCount, userMinuteCount, visitorDayCount, ipDayCount };
}

export async function createMessage(input: BuildMessageCreateDataInput): Promise<Message> {
    return prisma.message.create({
        data: buildMessageCreateData(input),
    });
}

export async function findMessageUser(userId: string): Promise<MessageUserSnapshot | null> {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            image: true,
        },
    });
}
