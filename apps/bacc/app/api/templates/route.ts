export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/templates?tagId=xxx&page=1&pageSize=20
 * 代理获取模板列表，支持标签过滤
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const qs = searchParams.toString();
        const url = qs
            ? `${API_BASE_URL}/api/templates?${qs}`
            : `${API_BASE_URL}/api/templates`;

        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
