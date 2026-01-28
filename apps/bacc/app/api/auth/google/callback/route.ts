import { handleGoogleCallback } from '@repo/auth-api';

export async function POST(request: Request) {
    return handleGoogleCallback(request as any);
}
