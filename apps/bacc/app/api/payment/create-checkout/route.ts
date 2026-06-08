export const runtime = 'edge';
import { auth } from '@/lib/auth';
import { makeInternalHeaders } from '@/lib/internal-auth';

export async function POST(request: Request) {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
        return Response.json(
            { error: 'Unauthorized', message: 'Missing backend user session' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { pricingPlanId, successUrl, cancelUrl, billingInterval } = body;

        if (!pricingPlanId) {
            return Response.json({ error: 'pricingPlanId is required' }, { status: 400 });
        }

        // 调用后端 API，传递数据库中的真实 userId
        const response = await fetch(
            `${process.env.API_BACKEND_URL}/api/payment/create-checkout`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await makeInternalHeaders(userId)),
                },
                body: JSON.stringify({
                    userId,  // 使用后端数据库的 userId
                    pricingPlanId,
                    successUrl,
                    cancelUrl,
                    billingInterval,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[API Proxy] Create checkout error:', data);
            return Response.json(data, { status: response.status });
        }

        return Response.json(data);
    } catch (error: any) {
        console.error('[API Proxy] Create checkout error:', error);
        return Response.json(
            { error: 'Failed to create checkout session', message: error.message },
            { status: 500 }
        );
    }
}
