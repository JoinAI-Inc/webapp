/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for better deployment
    output: 'standalone',

    // Experimental features for Cloudflare compatibility
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },

    // Image optimization configuration
    images: {
        domains: [],
        unoptimized: true, // Cloudflare Pages doesn't support Next.js image optimization
    },

    // Environment variables validation
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },

    // API 路由重写 - 开发环境将 /api 请求代理到后端 API 服务器
    // NextAuth 的 /api/auth 不会被代理
    async rewrites() {
        const apiBackend = process.env.API_BACKEND_URL || 'http://localhost:3001';
        return [
            {
                source: '/api/store/:path*',
                destination: `${apiBackend}/api/store/:path*`,
            },
            {
                source: '/api/admin/:path*',
                destination: `${apiBackend}/api/admin/:path*`,
            },
            {
                source: '/api/subscription/:path*',
                destination: `${apiBackend}/api/subscription/:path*`,
            },
            {
                source: '/api/payment/:path*',
                destination: `${apiBackend}/api/payment/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
