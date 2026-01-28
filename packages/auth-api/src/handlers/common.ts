import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAuthToken, generateAuthToken, serializeUser } from '../utils/auth';

/**
 * 从请求中提取 JWT token
 */
function extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
}

/**
 * 验证 token 是否有效
 * GET /api/auth/validate
 */
export async function handleValidate(request: NextRequest) {
    try {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.json(
                {
                    isValid: false,
                    error: 'NoToken',
                    message: 'No authentication token found'
                },
                { status: 401 }
            );
        }

        // 验证 token
        let payload;
        try {
            payload = verifyAuthToken(token);
        } catch (error) {
            return NextResponse.json(
                {
                    isValid: false,
                    error: 'InvalidToken',
                    message: 'Invalid or expired token'
                },
                { status: 401 }
            );
        }

        // 查询用户
        const user = await prisma.user.findUnique({
            where: { id: BigInt(payload.userId) },
            select: {
                id: true,
                email: true,
                fullName: true,
                status: true
            }
        });

        if (!user) {
            return NextResponse.json(
                {
                    isValid: false,
                    error: 'UserNotFound',
                    message: 'User not found'
                },
                { status: 401 }
            );
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                {
                    isValid: false,
                    error: 'UserInactive',
                    message: 'User account is not active',
                    status: user.status
                },
                { status: 401 }
            );
        }

        // Token 有效且用户状态正常
        const serializedUser = JSON.parse(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.fullName
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value));

        return NextResponse.json({
            isValid: true,
            user: serializedUser
        });

    } catch (error: any) {
        console.error('Validate auth error:', error);
        return NextResponse.json(
            {
                isValid: false,
                error: 'ServerError',
                message: 'Failed to validate authentication'
            },
            { status: 500 }
        );
    }
}

/**
 * 刷新 JWT token
 * POST /api/auth/refresh
 */
export async function handleRefresh(request: NextRequest) {
    try {
        const token = extractToken(request);

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'No token provided' },
                { status: 401 }
            );
        }

        // 验证 token
        let payload;
        try {
            payload = verifyAuthToken(token);
        } catch (error) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid token' },
                { status: 401 }
            );
        }

        // 查询用户
        const user = await prisma.user.findUnique({
            where: { id: BigInt(payload.userId) }
        });

        if (!user || user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Cannot refresh token for inactive user' },
                { status: 401 }
            );
        }

        // 生成新 token
        const newToken = generateAuthToken(user);

        return NextResponse.json({
            success: true,
            token: newToken
        });

    } catch (error: any) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { error: 'ServerError', message: 'Failed to refresh token' },
            { status: 500 }
        );
    }
}
