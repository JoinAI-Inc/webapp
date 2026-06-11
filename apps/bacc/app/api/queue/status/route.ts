export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/queue/status?taskId=xxx
 * 查询指定任务状态
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const taskId = req.nextUrl.searchParams.get('taskId');
        if (!taskId) {
            return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
        }
        const userId = (session as any).userId as string | undefined;
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized", message: "Missing backend user session" },
                { status: 401 }
            );
        }

        const response = await fetch(`${API_BASE_URL}/api/queue/status?taskId=${encodeURIComponent(taskId)}`, {
            headers: await makeInternalHeaders(userId),
            cache: 'no-store',
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Queue Status API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
