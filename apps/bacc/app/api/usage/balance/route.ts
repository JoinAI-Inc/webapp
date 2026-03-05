export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/** GET /api/usage/balance - 获取当前用户余额 */
export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = ((session as any).userId || session.user.id) as string;

    const res = await fetch(`${API_BASE_URL}/api/usage/balance/${userId}`, {
        headers: await makeInternalHeaders(userId),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
