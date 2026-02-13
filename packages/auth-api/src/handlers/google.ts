import { NextRequest, NextResponse } from 'next/server';
import { generateAuthToken, serializeUser, findOrCreateUser } from '../utils/auth';

// 防止授权码重复使用
const usedAuthCodes = new Set<string>();

// 定期清理（10分钟）
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        console.log('[OAuth] 清理过期授权码，当前大小:', usedAuthCodes.size);
        usedAuthCodes.clear();
    }, 10 * 60 * 1000);
}

interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

/**
 * Google OAuth 回调处理
 * POST /api/auth/google/callback
 */
export async function handleGoogleCallback(request: NextRequest) {
    try {
        const body = await request.json() as { code?: string };
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { error: 'Authorization code is required' },
                { status: 400 }
            );
        }

        // 防止授权码重复使用
        if (usedAuthCodes.has(code)) {
            console.warn('⚠️ [Google OAuth] 授权码重复使用被拒绝');
            return NextResponse.json(
                { error: 'Code already used', message: '授权码已被使用，请重新登录' },
                { status: 400 }
            );
        }

        usedAuthCodes.add(code);
        console.log('✅ [Google OAuth] 授权码已标记为使用');

        // 环境变量检查
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const callbackBase = process.env.OAUTH_CALLBACK_BASE;

        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured');
        }

        console.log('🔍 [Google OAuth Debug]');
        console.log('  OAUTH_CALLBACK_BASE:', callbackBase);

        // 带重试的 fetch 函数
        async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, options);
                    return response;
                } catch (error: any) {
                    console.warn(`[Google OAuth] Fetch attempt ${i + 1} failed:`, error.message);

                    // 如果是最后一次重试，抛出错误
                    if (i === retries - 1) {
                        throw error;
                    }

                    // 等待后重试（指数退避）
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
            throw new Error('All retry attempts failed');
        }

        // 用 code 换取 access token（带重试）
        const tokenResponse = await fetchWithRetry('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackBase,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json() as { error?: string; error_description?: string };
            console.error('Google token exchange failed:', error);
            throw new Error(error.error_description || error.error || 'Token exchange failed');
        }

        const tokenData = await tokenResponse.json() as GoogleTokenResponse;
        const { access_token, refresh_token, expires_in } = tokenData;

        // 获取用户信息（带重试）
        const userInfoResponse = await fetchWithRetry('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        const googleUser = await userInfoResponse.json() as GoogleUserInfo;

        // 查找或创建用户
        const user = await findOrCreateUser('google', {
            sub: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
            rawData: googleUser
        });

        // 生成 JWT
        const token = generateAuthToken(user);
        const serializedUser = serializeUser(user);

        return NextResponse.json({
            success: true,
            token,
            user: serializedUser
        });

    } catch (error: any) {
        console.error('Google OAuth error:', error);
        return NextResponse.json(
            {
                error: 'Authentication failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
