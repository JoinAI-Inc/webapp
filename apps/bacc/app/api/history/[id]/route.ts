import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/app/lib/storage";
import { auth } from "@/lib/auth";

/**
 * 获取单个历史记录
 * GET /api/history/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const file = await storage['prisma'].mediaFile.findFirst({
            where: {
                id: params.id,
                userId: session.userId,
                appId: 'bacc',
                status: 'active'
            }
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            url: file.storageUrl,
            thumbnailUrl: file.thumbnailUrl,
            generationType: file.generationType,
            promptData: file.promptData,
            createdAt: file.createdAt
        });
    } catch (error: any) {
        console.error("History Detail API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

/**
 * 删除历史记录
 * DELETE /api/history/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 验证文件属于当前用户
        const file = await storage['prisma'].mediaFile.findFirst({
            where: {
                id: params.id,
                userId: session.userId,
                appId: 'bacc'
            }
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // 软删除
        const result = await storage.delete(params.id, { permanent: false });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("History Delete API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
