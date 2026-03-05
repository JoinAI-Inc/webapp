export const runtime = 'edge';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.backendJwt) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/store/plans${queryString ? `?${queryString}` : ''}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.backendJwt}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('[API Proxy] Store plans error:', error);
        return Response.json(
            { error: 'Failed to fetch store plans', message: error.message },
            { status: 500 }
        );
    }
}
