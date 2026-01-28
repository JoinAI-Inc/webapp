import { handleRefresh } from '@repo/auth-api';

export async function POST(request: Request) {
    return handleRefresh(request as any);
}
