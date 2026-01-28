import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

// 使用 Prisma 的类型推断获取 User 类型
type User = Prisma.UserGetPayload<{}>;

/**
 * 生成 JWT token
 */
export function generateAuthToken(user: User): string {
    const payload = {
        userId: user.id.toString(),
        email: user.email,
        name: user.fullName
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * 验证 JWT token
 */
export function verifyAuthToken(token: string): { userId: string; email: string; name: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        const payload = jwt.verify(token, secret) as any;
        return {
            userId: payload.userId,
            email: payload.email,
            name: payload.name
        };
    } catch (error) {
        throw new Error('Invalid token');
    }
}

/**
 * 序列化用户对象（处理 BigInt）
 */
export function serializeUser(user: User) {
    return JSON.parse(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.fullName
    }, (key, value) => typeof value === 'bigint' ? value.toString() : value));
}

interface ProviderData {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date | null;
    rawData: any;
}

/**
 * 查找或创建用户（从社交登录）
 */
export async function findOrCreateUser(provider: string, providerData: ProviderData): Promise<User> {
    const { sub, email, name, picture, accessToken, refreshToken, expiresAt, rawData } = providerData;

    // 检查是否已经绑定
    let socialBind = await prisma.userSocialBind.findUnique({
        where: {
            provider_providerSub: {
                provider,
                providerSub: sub
            }
        },
        include: {
            user: true
        }
    });

    if (socialBind) {
        // 更新现有绑定
        socialBind = await prisma.userSocialBind.update({
            where: { id: socialBind.id },
            data: {
                socialEmail: email,
                socialName: name,
                socialAvatar: picture,
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenExpiresAt: expiresAt,
                rawData: JSON.stringify(rawData),
                updatedAt: new Date()
            },
            include: {
                user: true
            }
        });

        return socialBind.user;
    }

    // 尝试通过邮箱查找现有用户
    let user: User | null = null;
    if (email) {
        user = await prisma.user.findUnique({
            where: { email }
        });
    }

    // 创建新用户
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: email || `${provider}_${sub}@placeholder.com`,
                fullName: name || `${provider} User`,
                status: 'ACTIVE'
            }
        });
    }

    // 创建社交绑定
    await prisma.userSocialBind.create({
        data: {
            userId: user.id,
            provider,
            providerSub: sub,
            socialEmail: email,
            socialName: name,
            socialAvatar: picture,
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiresAt: expiresAt,
            rawData: JSON.stringify(rawData)
        }
    });

    return user;
}
