export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';
// 使用 App 的实际 appKey（来自环境变量）
const APP_KEY = process.env.NEXT_PUBLIC_APP_ID || 'bacc';

/**
 * GET /api/plans
 * 获取当前 App 的可购买套餐（USAGE_PACK + ONE_TIME）
 * 对应后端: GET /api/store/apps/:appKey
 */
export async function GET(_req: NextRequest) {
    const res = await fetch(`${API_BASE_URL}/api/store/apps/${APP_KEY}`, {
        cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    // 同时展示 USAGE_PACK（按次数）和 ONE_TIME（功能解锁）套餐
    const plans = (data.plans || []).filter(
        (p: any) => ['USAGE_PACK', 'ONE_TIME'].includes(p.planType) && p.status === 'ACTIVE'
    );

    return NextResponse.json(plans);
}

