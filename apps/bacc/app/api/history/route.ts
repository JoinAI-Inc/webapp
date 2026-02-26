import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/app/lib/storage";
import { auth } from "@/lib/auth";

/**
 * 查询用户生成历史
 * GET /api/history?page=1&type=magic&pageSize=20
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const type = searchParams.get('type'); // magic, decor, hanfu, video

        // 直接使用 Prisma 查询（因为 SDK 不支持按 userId 查询）
        const where: any = {
            appId: 'bacc',
            userId: session.userId,
            status: 'active'
        };

        if (type) {
            // 统一 magic/hanfu 为 portrait
            const mappedType = (type === 'magic' || type === 'hanfu') ? 'portrait' : type;
            where.generationType = mappedType;
        }

        const [items, total] = await Promise.all([
            storage['prisma'].mediaFile.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            storage['prisma'].mediaFile.count({ where })
        ]);

        return NextResponse.json({
            items: items.map((item: (typeof items)[number]) => ({
                id: item.id,
                fileName: item.fileName,
                fileType: item.fileType,
                url: item.storageUrl,
                thumbnailUrl: item.thumbnailUrl,
                generationType: item.generationType,
                promptData: item.promptData,
                createdAt: item.createdAt
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error: any) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
