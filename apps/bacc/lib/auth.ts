import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { logger } from "./logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
    basePath: "/api/auth",
    trustHost: true,
    debug: process.env.NODE_ENV === 'development',
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    session: {
        strategy: "jwt", // Use JWT for sessions (no database session table needed)
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            // 传递后端 JWT 到 session
            if (token.backendJwt) {
                (session as any).backendJwt = token.backendJwt;
            }
            if (token.userId) {
                (session as any).userId = token.userId;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            // 初次登录时调用后端获取 JWT
            if (account && user) {
                try {
                    logger.debug('NextAuth JWT - 开始调用后端认证', {
                        provider: account.provider,
                        userId: user.id
                    });

                    const res = await fetch(`${process.env.API_BACKEND_URL}/api/auth/nextauth/callback`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                        }),
                    });

                    logger.debug('NextAuth JWT - 后端响应状态', { status: res.status });

                    if (res.ok) {
                        const data = await res.json();

                        // 注意: data.token 会被 logger 自动脱敏
                        logger.debug('NextAuth JWT - 后端认证成功', {
                            hasToken: !!data.token,
                            userId: data.user?.id
                        });

                        // 保存后端 JWT 到 token
                        token.backendJwt = data.token;
                        token.userId = data.user?.id || user.id;
                    } else {
                        logger.error('NextAuth JWT - 后端认证失败', { status: res.status });
                        token.userId = user.id;
                    }
                } catch (error) {
                    logger.error('NextAuth JWT - 调用后端失败', error);
                }
            }
            return token;
        },
    },
    pages: {
        signIn: '/login',
    },
});
