import { handleGetAppById } from '@repo/auth-api';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleGetAppById(params.id);
}
