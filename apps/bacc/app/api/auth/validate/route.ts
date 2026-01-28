import { handleValidate } from '@repo/auth-api';

export async function GET(request: Request) {
    return handleValidate(request as any);
}
