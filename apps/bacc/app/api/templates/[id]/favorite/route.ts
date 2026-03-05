export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * POST /api/templates/[id]/favorite
 * 收藏 / 取消收藏模板
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }
        const userId = ((session as any).userId || session.user.id) as string;
        if (!userId) {
            return NextResponse.json({ error: "用户ID未找到" }, { status: 401 });
        }

        const response = await fetch(`${API_BASE_URL}/api/templates/${params.id}/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await makeInternalHeaders(userId)),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
