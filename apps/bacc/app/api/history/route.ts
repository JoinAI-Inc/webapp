import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

export const runtime = 'edge';

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = ((session as any).userId || session.user.id) as string;

    const { searchParams } = new URL(req.url);
    const url = `${API_BASE_URL}/api/history?${searchParams.toString()}`;

    const res = await fetch(url, { headers: await makeInternalHeaders(userId) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
