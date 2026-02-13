import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/app/lib/storage";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        // 获取用户 session
        const session = await auth();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized. Please login first." }, { status: 401 });
        }

        const { image, scene, identity, voice, music, isMagic } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const apiKey = process.env.NANO_BANANA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const base64Data = image.split(",")[1];

        const { VIDEO_PROMPTS, MAGIC_STUDIO_PROMPTS } = await import("@/config/prompts");
        const prompt = isMagic
            ? MAGIC_STUDIO_PROMPTS.motionPrompt(voice || "Gentle", music || "Traditional")
            : VIDEO_PROMPTS.basePrompt(scene, identity, voice, music);

        const models = [
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview"
        ];

        let finalResult: any = null;
        let lastError: any = null;

        for (const modelId of models) {
            console.log(`Attempting Video generation with model: ${modelId}...`);
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

            try {
                const payload: any = {
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: "image/png",
                                        data: base64Data,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        response_modalities: ["IMAGE"]
                    }
                };

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    finalResult = data;
                    console.log(`Successfully generated Video Frame using ${modelId}`);
                    break;
                } else {
                    console.error(`Video Model ${modelId} failed:`, data.error?.message || "Unknown error");
                    lastError = data.error?.message || `Model ${modelId} failed`;
                }
            } catch (err: any) {
                console.error(`Video Fetch error for ${modelId}:`, err.message);
                lastError = err.message;
            }
        }

        if (!finalResult) {
            return NextResponse.json({ error: lastError || "AI generation failed" }, { status: 500 });
        }

        let base64Image = "";
        let mimeType = "image/png";

        try {
            const candidates = finalResult.candidates || [];
            for (const cand of candidates) {
                const parts = cand.content?.parts || cand.parts || [];
                for (const part of parts) {
                    const img = part.inline_data || part.inlineData;
                    if (img && img.data) {
                        base64Image = img.data;
                        mimeType = img.mime_type || img.mimeType || "image/png";
                        break;
                    }
                }
                if (base64Image) break;
            }
        } catch (e) { }

        if (!base64Image) {
            return NextResponse.json({ error: "No image found in AI response" }, { status: 500 });
        }

        // 上传到 R2
        console.log(`📤 Uploading Video to R2 for user ${session.userId}...`);
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `video-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['video', 'generated'],
            metadata: {
                generationType: 'video',
                scene,
                identity,
                voice,
                music,
                isMagic
            },
            createdBy: session.userId.toString()
        });

        // 更新数据库记录
        await storage['prisma'].mediaFile.update({
            where: { id: uploadResult.id },
            data: {
                userId: session.userId,
                generationType: 'video',
                promptData: {
                    scene,
                    identity,
                    voice,
                    music,
                    isMagic
                }
            }
        });

        console.log(`✅ Saved to R2: ${uploadResult.url}`);

        return NextResponse.json({
            videoUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id,
            mimeType
        });
    } catch (error: any) {
        console.error("Video API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
