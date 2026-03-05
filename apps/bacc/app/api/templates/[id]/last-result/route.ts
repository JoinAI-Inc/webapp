export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/templates/[id]/last-result
 * 获取当前用户对此模板的最近一次生成结果
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ imageUrl: null });
        }

        const userId = ((session as any).userId || session.user.id) as string;
        const response = await fetch(
            `${API_BASE_URL}/api/templates/${params.id}/last-result`,
            { headers: await makeInternalHeaders(userId) }
        );

        if (!response.ok) {
            return NextResponse.json({ imageUrl: null });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ imageUrl: null });
    }
}
