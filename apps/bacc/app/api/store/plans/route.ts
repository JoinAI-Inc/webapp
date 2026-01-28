import { handleGetPlans } from '@repo/auth-api';

export async function GET(request: Request) {
    return handleGetPlans(request as any);
}
