import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

export const runtime = 'edge';

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = ((session as any).userId || session.user.id) as string;

    const res = await fetch(`${API_BASE_URL}/api/history/${params.id}`, {
        headers: await makeInternalHeaders(userId),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = ((session as any).userId || session.user.id) as string;

    const res = await fetch(`${API_BASE_URL}/api/history/${params.id}`, {
        method: 'DELETE',
        headers: await makeInternalHeaders(userId),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
