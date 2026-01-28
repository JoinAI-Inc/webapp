import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicRoute, PROTECTED_API_ROUTES } from './config/routes';

/**
 * Next.js 中间件
 * 保护需要认证的 API 路由
 */
export function middleware(request: NextRequest) {
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

    // 从 Cookie 获取令牌
    const token = request.cookies.get('token')?.value;

    // 如果需要认证但没有令牌,返回 401
    if ((needsAuth || needsSubscription) && !token) {
        return NextResponse.json(
            { error: 'Unauthorized', message: '需要登录' },
            { status: 401 }
        );
    }

    // TODO: 验证令牌有效性
    // 在真实应用中,应该调用后端 API 验证令牌
    // const isValid = await validateToken(token);
    // if (!isValid) {
    //     return NextResponse.json(
    //         { error: 'Unauthorized', message: '令牌无效或已过期' },
    //         { status: 401 }
    //     );
    // }

    // TODO: 如果需要订阅,检查订阅状态
    // if (needsSubscription) {
    //     const hasSubscription = await checkSubscription(token);
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
         */
        '/api/:path*',
    ],
};
