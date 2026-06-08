export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';
const MAX_MESSAGE_LENGTH = 2000;

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIP = req.headers.get("x-real-ip");
    if (realIP) return realIP.trim();
    return "unknown";
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const content = body?.content?.trim();

    if (!content) {
        return NextResponse.json(
            { error: "Message content is required." },
            { status: 400 }
        );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
            { error: `Message content must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
            { status: 400 }
        );
    }

    const session = await auth();
    const userId = session?.user
        ? ((session as any).userId || session.user.id)
        : null;

    const authHeaders = userId ? await makeInternalHeaders(userId) : {};

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/api/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                'x-forwarded-for': getClientIP(req),
                ...(req.headers.get('x-real-ip') ? { 'x-real-ip': req.headers.get('x-real-ip') as string } : {}),
                ...(req.headers.get('user-agent') ? { 'user-agent': req.headers.get('user-agent') as string } : {}),
            },
            body: JSON.stringify({ content }),
        });
    } catch {
        return NextResponse.json(
            { error: 'Failed to submit message.' },
            { status: 500 },
        );
    }

    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
}
