import { handleGetEntitlements } from '@repo/auth-api';

export async function GET(request: Request) {
    return handleGetEntitlements(request as any);
}
