import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { syncBackendIdentity } from "./backend-auth";
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
            if (account) {
                (token as any).authProvider = account.provider;
                (token as any).authProviderAccountId = account.providerAccountId;
            }

            if (user) {
                token.email = user.email || token.email;
                token.name = user.name || token.name;
                token.picture = user.image || token.picture;
            }

            // 首次调用失败后，在后续 session 请求中继续补偿后端身份。
            if (!token.backendJwt || !token.userId) {
                try {
                    logger.debug('NextAuth JWT - 开始调用后端认证', {
                        provider: (token as any).authProvider || 'google',
                        providerAccountId: (token as any).authProviderAccountId || token.sub,
                    });

                    await syncBackendIdentity(token as any, {
                        apiBackendUrl: process.env.API_BACKEND_URL,
                    });

                    logger.debug('NextAuth JWT - 后端认证成功', {
                        hasToken: !!token.backendJwt,
                        userId: token.userId,
                    });
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
