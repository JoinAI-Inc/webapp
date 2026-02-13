import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';
import { PROTECTED_API_ROUTES } from './config/routes';

/**
 * Next.js 中间件
 * 使用 Auth.js 保护需要认证的 API 路由
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 只处理 API 路由
    if (!pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // 检查是否需要认证
    const needsAuth = PROTECTED_API_ROUTES.authRequired.some(route => pathname.startsWith(route));
    const needsSubscription = PROTECTED_API_ROUTES.subscriptionRequired.some(route => pathname.startsWith(route));

    // 公开 API,允许访问
    if (!needsAuth && !needsSubscription) {
        return NextResponse.next();
    }

    // 使用 Auth.js 获取 session
    const session = await auth();

    // 如果需要认证但没有 session,返回 401
    if ((needsAuth || needsSubscription) && !session) {
        return NextResponse.json(
            { error: 'Unauthorized', message: '需要登录' },
            { status: 401 }
        );
    }

    // TODO: 如果需要订阅,检查订阅状态
    // if (needsSubscription && session) {
    //     const hasSubscription = await checkSubscription(session.user.id);
    //     if (!hasSubscription) {
    //         return NextResponse.json(
    //             { error: 'Forbidden', message: '需要订阅' },
    //             { status: 403 }
    //         );
    //     }
    // }

    // 允许请求继续
    return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
    matcher: [
        /*
         * 匹配所有 API 路由:
         * - /api/*
         * 排除 Auth.js API 路由
         */
        '/api/((?!auth).*)',
    ],
};

