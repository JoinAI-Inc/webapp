export const runtime = 'edge';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.backendJwt) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/store/checkout`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.backendJwt}`,
                },
                body: JSON.stringify(body),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('[API Proxy] Store checkout error:', error);
        return Response.json(
            { error: 'Failed to create checkout', message: error.message },
            { status: 500 }
        );
    }
}
