import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyInternalRequest } from '../lib/internal-auth.js';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userEmail?: string;
    userName?: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    iat?: number;
    exp?: number;
}

/**
 * JWT认证中间件
 * 验证请求头中的Authorization: Bearer <token>
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        // 附加用户信息到请求对象
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userName = decoded.name;

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Token has expired',
                expiredAt: error.expiredAt
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'InvalidToken',
                message: 'Invalid token'
            });
        }

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication failed'
        });
    }
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

/**
 * 接受外部 JWT 或 BACC server-to-server 内部签名。
 * 浏览器仍不能直接伪造内部签名，因为 WORKER_SECRET 只存在于服务端环境。
 */
export function authenticateJWTOrInternal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const internalUserId = verifyInternalRequest(
        firstHeaderValue(req.headers['x-internal-user-id']),
        firstHeaderValue(req.headers['x-internal-timestamp']),
        firstHeaderValue(req.headers['x-internal-signature']),
    );

    if (internalUserId) {
        req.userId = internalUserId;
        return next();
    }

    return authenticateJWT(req, res, next);
}

/**
 * 可选的JWT认证中间件
 * 如果token存在则验证,不存在则继续(不强制要求登录)
 */
export function optionalAuthenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 没有token,继续处理
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userName = decoded.name;
    } catch (error) {
        // token无效,但不阻止请求
        console.warn('Optional JWT verification failed:', error);
    }

    next();
}
