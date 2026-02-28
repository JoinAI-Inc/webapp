import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/app/lib/storage";
import { nanoid } from "nanoid";
import { makeInternalHeaders } from "@/lib/internal-auth";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * 将 base64 data URL 上传到 R2，返回公开 URL
 */
async function uploadBase64ToR2(dataUrl: string, userId: string): Promise<string> {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 image format');
    const [, extension, data] = matches;
    const buffer = Buffer.from(data, 'base64');
    const result = await storage.upload({
        file: buffer,
        fileName: `template-input-${nanoid()}.${extension}`,
        appId: 'bacc',
        createdBy: userId,
        metadata: { userId, generationType: 'template', stage: 'input' },
    });
    return result.url;
}

/**
 * POST /api/generate/template
 * Body: { templateId: string; slots: Array<{ refId: string; slotType?: string; imageSource: string }> }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }
        const userId = ((session as any).userId || session.user.id) as string;
        if (!userId) {
            return NextResponse.json({ error: "用户ID未找到" }, { status: 401 });
        }

        const { templateId, slots } = await req.json() as {
            templateId: string;
            slots: Array<{ refId: string; slotType?: string; imageSource: string }>;
        };

        if (!templateId || !Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json({ error: "templateId 和 slots 必填" }, { status: 400 });
        }

        // 将 base64 图片先上传到 R2，避免 payload 过大
        console.log(`[Template Route] Uploading ${slots.length} slot images to R2...`);
        const uploadedSlots = await Promise.all(
            slots.map(async (slot) => {
                if (slot.imageSource.startsWith('data:image/')) {
                    const url = await uploadBase64ToR2(slot.imageSource, userId);
                    return { ...slot, imageSource: url };
                }
                return slot;
            })
        );

        // 调用后端队列接口
        const apiUrl = `${API_BASE_URL}/api/templates/${templateId}/generate`;
        console.log(`[Template Route] Calling: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...makeInternalHeaders(userId),
            },
            body: JSON.stringify({ slots: uploadedSlots }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[Template Route] Backend error:`, text.substring(0, 500));
            return NextResponse.json({ error: 'Failed to submit task' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[Template Route] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
