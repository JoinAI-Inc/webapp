import { handleGetApps } from '@repo/auth-api';

export async function GET(request: Request) {
    return handleGetApps(request as any);
}
