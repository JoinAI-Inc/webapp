import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/queue/current-task
 * 获取当前用户的任务状态
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${API_BASE_URL}/api/queue/current-task?userId=${session.userId}`);

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Current Task API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
