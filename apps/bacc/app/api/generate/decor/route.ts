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

        const { image, style, elements } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const apiKey = process.env.NANO_BANANA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const base64Data = image.split(",")[1];
        const elementDescs = elements?.length > 0 ? ` including ${elements.join(", ")}` : "";

        const { DECOR_PROMPTS } = await import("@/config/prompts");
        const prompt = DECOR_PROMPTS.basePrompt(style, elementDescs);

        const models = [
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview",
            "gemini-2.0-flash-exp-image-generation",
        ];

        let finalResult: any = null;
        let lastError: any = null;

        for (const modelId of models) {
            console.log(`Attempting Decor generation with model: ${modelId}...`);
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
                };

                if (modelId.includes("image") || modelId.includes("preview")) {
                    payload.generationConfig = { response_modalities: ["IMAGE"] };
                }

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    finalResult = data;
                    console.log(`Successfully generated Decor using ${modelId}`);
                    break;
                } else {
                    console.error(`Decor Model ${modelId} failed:`, data.error?.message || "Unknown error");
                    lastError = data.error?.message || `Model ${modelId} failed`;
                }
            } catch (err: any) {
                console.error(`Decor Fetch error for ${modelId}:`, err.message);
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
        console.log(`📤 Uploading Decor to R2 for user ${session.userId}...`);
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `decor-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['decor', 'generated'],
            metadata: {
                generationType: 'decor',
                style,
                elements
            },
            createdBy: session.userId.toString()
        });

        // 更新数据库记录
        await storage['prisma'].mediaFile.update({
            where: { id: uploadResult.id },
            data: {
                userId: session.userId,
                generationType: 'decor',
                promptData: {
                    style,
                    elements
                }
            }
        });

        console.log(`✅ Saved to R2: ${uploadResult.url}`);

        return NextResponse.json({
            image: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id
        });
    } catch (error: any) {
        console.error("Decor API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
