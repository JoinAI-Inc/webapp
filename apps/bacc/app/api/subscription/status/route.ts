import { handleSubscriptionStatus } from '@repo/auth-api';

export async function GET(request: Request) {
    return handleSubscriptionStatus(request as any);
}
