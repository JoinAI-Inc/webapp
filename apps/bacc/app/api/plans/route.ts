export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

function getAppIdentifier() {
    const configured = process.env.NEXT_PUBLIC_APP_ID;
    return configured && configured !== 'your_app_id_here' ? configured : 'bacc';
}

/**
 * GET /api/plans
 * 获取当前 App 的可购买套餐（USAGE_PACK + ONE_TIME）
 * 对应后端: GET /api/store/plans?appKey=:appKey
 */
export async function GET(_req: NextRequest) {
    try {
        const appIdentifier = getAppIdentifier();
        const params = new URLSearchParams({ appKey: appIdentifier });
        const res = await fetch(`${API_BASE_URL}/api/store/plans?${params.toString()}`, {
            cache: 'no-store',
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            return NextResponse.json(
                { error: data?.error || 'Failed to fetch plans' },
                { status: res.status }
            );
        }

        // 同时展示 USAGE_PACK（按次数）和 ONE_TIME（功能解锁）套餐
        const plans = (Array.isArray(data) ? data : data?.plans || []).filter(
            (p: any) => ['USAGE_PACK', 'ONE_TIME'].includes(p.planType)
                && p.status === 'ACTIVE'
                && p.sellable !== false
        );

        return NextResponse.json(plans);
    } catch (error: any) {
        console.error('[API Proxy] Plans error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch plans', message: error.message },
            { status: 502 }
        );
    }
}
