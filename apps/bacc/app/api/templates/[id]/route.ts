export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * GET /api/templates/[id]
 * 代理获取模板详情（含 slots）
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/templates/${params.id}`, {
            cache: 'no-store',
        });
        if (!response.ok) {
            return NextResponse.json({ error: "Template not found" }, { status: response.status });
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
