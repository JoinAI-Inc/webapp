import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@repo/database';
import { User } from '@prisma/client';

const router = express.Router();

// Helper function to generate JWT token
function generateAuthToken(user: User) {
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

/**
 * POST /api/auth/nextauth/callback
 * NextAuth专用的回调端点
 * 接收 NextAuth 已验证的用户信息，返回后端 JWT
 */
router.post('/nextauth/callback', async (req: Request, res: Response) => {
    try {
        const { googleId, email, name, image } = req.body;

        if (!googleId || !email) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'googleId and email are required'
            });
        }

        console.log('[NextAuth Callback] 收到用户信息:', { googleId, email, name });

        // 查找或创建用户（基于 Google ID 和 email）
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    {
                        socialBinds: {
                            some: {
                                provider: 'google',
                                providerSub: googleId
                            }
                        }
                    }
                ]
            },
            include: {
                socialBinds: true
            }
        });

        if (!user) {
            // 创建新用户
            console.log('[NextAuth Callback] 创建新用户');
            user = await prisma.user.create({
                data: {
                    email: email,
                    name: name || email.split('@')[0],
                    status: 'ACTIVE',
                    socialBinds: {
                        create: {
                            provider: 'google',
                            providerSub: googleId,
                            socialEmail: email,
                            socialName: name,
                            socialAvatar: image,
                        }
                    }
                },
                include: {
                    socialBinds: true
                }
            });
        } else {
            console.log('[NextAuth Callback] 用户已存在，更新信息');

            // 检查是否已有 Google 绑定
            const googleBind = user.socialBinds?.find(
                bind => bind.provider === 'google' && bind.providerSub === googleId
            );

            if (!googleBind) {
                // 添加 Google 绑定
                await prisma.userSocialBind.create({
                    data: {
                        userId: user.id,
                        provider: 'google',
                        providerSub: googleId,
                        socialEmail: email,
                        socialName: name,
                        socialAvatar: image,
                    }
                });
            } else {
                // 更新现有绑定
                await prisma.userSocialBind.update({
                    where: { id: googleBind.id },
                    data: {
                        socialEmail: email,
                        socialName: name,
                        socialAvatar: image,
                        updatedAt: new Date()
                    }
                });
            }
        }

        // 生成 JWT token
        const token = generateAuthToken(user);

        console.log('[NextAuth Callback] Token 生成成功');

        // 返回格式
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status
            }
        });

    } catch (error: any) {
        console.error('[NextAuth Callback] 错误:', error);
        res.status(500).json({
            error: 'ServerError',
            message: 'Failed to process NextAuth callback',
            details: error.message
        });
    }
});

export default router;
