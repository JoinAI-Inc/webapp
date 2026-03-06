export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/templates/favorites
 * 获取当前用户收藏的模板列表
 */
export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }
        const userId = ((session as any).userId || session.user.id) as string;
        if (!userId) {
            return NextResponse.json({ error: "用户ID未找到" }, { status: 401 });
        }

        const response = await fetch(`${API_BASE_URL}/api/templates/favorites`, {
            headers: { ...(await makeInternalHeaders(userId)) },
            cache: 'no-store',
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
