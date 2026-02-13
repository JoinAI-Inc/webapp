export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        // 公开端点，不需要认证
        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/store/apps${queryString ? `?${queryString}` : ''}`,
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
        console.error('[API Proxy] Store apps error:', error);
        return Response.json(
            { error: 'Failed to fetch store apps', message: error.message },
            { status: 500 }
        );
    }
}
