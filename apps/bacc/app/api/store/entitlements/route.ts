import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    const session = await auth();

    logger.debug('API Proxy Entitlements - Session', {
        hasSession: !!session,
        hasBackendJwt: !!session?.backendJwt,
        userId: (session as any)?.userId
    });

    if (!session?.backendJwt) {
        logger.warn('API Proxy Entitlements - 未找到 backendJwt');
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const backendUrl = `${process.env.API_BACKEND_URL}/api/store/entitlements${queryString ? `?${queryString}` : ''}`;

        logger.debug('API Proxy Entitlements - 调用后端', { url: backendUrl });

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.backendJwt}`,
            },
        });

        const data = await response.json();

        logger.debug('API Proxy Entitlements - 后端响应', {
            status: response.status,
            ok: response.ok,
            dataCount: Array.isArray(data) ? data.length : (data.entitlements?.length || 0)
        });

        if (!response.ok) {
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        logger.error('API Proxy Entitlements error', error);
        return Response.json(
            { error: 'Failed to fetch entitlements', message: error.message },
            { status: 500 }
        );
    }
}
