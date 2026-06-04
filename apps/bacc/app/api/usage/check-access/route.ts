export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/** POST /api/usage/check-access - 检查当前用户是否可访问某功能 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = ((session as any).userId || session.user.id) as string;
    const body = await req.json().catch(() => ({}));
    const featureKey = body?.featureKey;

    if (!featureKey) {
        return NextResponse.json({ error: "Missing required field: featureKey" }, { status: 400 });
    }

    const res = await fetch(`${API_BASE_URL}/api/usage/check-access`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(await makeInternalHeaders(userId)),
        },
        body: JSON.stringify({ userId, featureKey }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
