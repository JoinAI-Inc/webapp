export const runtime = 'edge';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 这是公开端点，不需要认证
        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/store/apps/${id}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('[API Proxy] App details error:', error);
        return Response.json(
            { error: 'Failed to fetch app details', message: error.message },
            { status: 500 }
        );
    }
}
