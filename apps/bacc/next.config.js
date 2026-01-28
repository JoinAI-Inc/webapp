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
};

module.exports = nextConfig;
