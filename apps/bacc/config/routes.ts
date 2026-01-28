/**
 * 路由访问控制配置
 */

// 公开路由 - 无需任何认证
export const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/auth/callback',
];

// 需要登录的路由 - 需要用户已登录
export const AUTH_REQUIRED_ROUTES = [
    '/subscribe',
    '/payment',
];

// 需要订阅的路由 - 需要用户已登录且已订阅
export const SUBSCRIPTION_REQUIRED_ROUTES = [
    '/studio',
];

// 需要保护的 API 路由
export const PROTECTED_API_ROUTES = {
    // 需要登录的 API
    authRequired: [
        '/api/payment',
        '/api/user',
    ],
    // 需要订阅的 API
    subscriptionRequired: [
        '/api/generate',
    ],
};

/**
 * 检查路径是否匹配某个模式
 */
export function matchesRoute(path: string, routes: string[]): boolean {
    return routes.some(route => {
        // 精确匹配
        if (path === route) return true;

        // 前缀匹配 (例如 /studio 匹配 /studio/magic)
        if (path.startsWith(route + '/')) return true;

        return false;
    });
}

/**
 * 判断路径是否为公开路由
 */
export function isPublicRoute(path: string): boolean {
    return matchesRoute(path, PUBLIC_ROUTES);
}

/**
 * 判断路径是否需要登录
 */
export function isAuthRequired(path: string): boolean {
    return matchesRoute(path, [...AUTH_REQUIRED_ROUTES, ...SUBSCRIPTION_REQUIRED_ROUTES]);
}

/**
 * 判断路径是否需要订阅
 */
export function isSubscriptionRequired(path: string): boolean {
    return matchesRoute(path, SUBSCRIPTION_REQUIRED_ROUTES);
}
