import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/app/lib/storage";
import { nanoid } from "nanoid";

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * 将 base64 图片上传到 R2
 */
async function uploadBase64ToR2(base64: string, userId: string): Promise<string> {
    // base64 格式: data:image/jpeg;base64,/9j/4AAQ...
    const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image format');
    }

    const [, extension, data] = matches;
    const buffer = Buffer.from(data, 'base64');

    // 生成唯一文件名
    const fileName = `portrait-input-${nanoid()}.${extension}`;

    // 上传到 R2
    const result = await storage.upload({
        file: buffer,
        fileName,
        appId: 'bacc',
        createdBy: userId,
        metadata: {
            userId,
            generationType: 'portrait',
            stage: 'input', // 标记为输入图片
        },
    });

    return result.url;
}

export async function POST(req: NextRequest) {
    try {
        // 获取用户 session
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }

        const userId = (session as any).userId;
        if (!userId) {
            return NextResponse.json({ error: "用户ID未找到" }, { status: 401 });
        }

        const { characters, backgroundType, backgroundDesc, elements, customBg } = await req.json();

        if (!characters || !Array.isArray(characters)) {
            return NextResponse.json({ error: "Invalid characters data." }, { status: 400 });
        }

        // 先上传所有图片到 R2，替换 base64 为 URL
        console.log(`[Magic] Uploading ${characters.length} character images to R2...`);
        const uploadedCharacters = await Promise.all(
            characters.map(async (char) => {
                if (char.image && char.image.startsWith('data:image/')) {
                    // 是 base64，上传到 R2
                    const url = await uploadBase64ToR2(char.image, userId);
                    console.log(`[Magic] Uploaded character image: ${url.substring(0, 50)}...`);
                    return { ...char, image: url };
                }
                // 已经是 URL，直接使用
                return char;
            })
        );

        // 处理自定义背景
        let uploadedCustomBg = customBg;
        if (customBg && customBg.startsWith('data:image/')) {
            console.log(`[Magic] Uploading custom background to R2...`);
            uploadedCustomBg = await uploadBase64ToR2(customBg, userId);
            console.log(`[Magic] Uploaded custom bg: ${uploadedCustomBg.substring(0, 50)}...`);
        }

        // 调用 api 后端的队列接口
        const apiUrl = `${API_BASE_URL}/api/queue/submit`;
        console.log(`[Magic] Calling queue API: ${apiUrl}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId.toString(),
                type: 'magic',
                payload: {
                    characters: uploadedCharacters, // 使用 R2 URL
                    backgroundType,
                    backgroundDesc,
                    elements,
                    customBg: uploadedCustomBg, // 使用 R2 URL
                },
            }),
        });

        console.log(`[Magic] Response status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[Magic] Error response:`, text.substring(0, 500));
            return NextResponse.json({ error: 'Failed to submit task' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Magic API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
