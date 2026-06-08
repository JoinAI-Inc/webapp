import { prisma } from '@repo/database';
import type { Message, Prisma, User } from '@prisma/client';

export type MessageUserSnapshot = Pick<User, 'id' | 'email' | 'name' | 'image'>;

export type BuildMessageCreateDataInput = {
    content: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    user?: MessageUserSnapshot | null;
};

export function buildMessageCreateData({
    content,
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
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
    };
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
