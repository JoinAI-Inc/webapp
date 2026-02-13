import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.backendJwt) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return Response.json({ error: 'sessionId is required' }, { status: 400 });
        }

        // 调用后端 API 同步支付状态
        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/payment/sync-session`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.backendJwt}`,
                },
                body: JSON.stringify({ sessionId }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[API Proxy] Sync session error:', data);
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('[API Proxy] Sync session error:', error);
        return Response.json(
            { error: 'Failed to sync payment session', message: error.message },
            { status: 500 }
        );
    }
}
