import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

export const runtime = 'edge';

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * POST /api/generate/magic/image
 * 直接将请求代理到后端队列接口，后端负责上传 R2
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const userId = ((session as any).userId || session.user.id) as string;
    if (!userId) return NextResponse.json({ error: "用户ID未找到" }, { status: 401 });

    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/api/queue/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(await makeInternalHeaders(userId)),
        },
        body: JSON.stringify({
            type: 'magic',
            payload: body,
        }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}
