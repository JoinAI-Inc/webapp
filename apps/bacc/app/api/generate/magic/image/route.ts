import { NextRequest, NextResponse } from "next/server";
import { MAGIC_STUDIO_PROMPTS } from "@/config/prompts";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        // 1. 获取当前登录用户
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

        // 2. 检查用户是否有权限访问该功能
        const featureKey = 'bacc_hanfu_generation'; // 使用汉服生成功能
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        console.log(`[Magic Generation] Checking access for user ${userId}, feature ${featureKey}`);

        try {
            const checkResponse = await fetch(`${apiUrl}/api/usage/check-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    featureKey
                })
            });

            const checkData = await checkResponse.json();

            if (!checkResponse.ok || !checkData.hasAccess) {
                console.log(`[Magic Generation] Access denied:`, checkData);
                return NextResponse.json({
                    error: checkData.message || "您没有权限使用此功能，请购买订阅或次数包"
                }, { status: 403 });
            }

            console.log(`[Magic Generation] Access granted:`, checkData);
        } catch (error: any) {
            console.error(`[Magic Generation] Access check failed:`, error);
            return NextResponse.json({ error: "权限检查失败，请稍后重试" }, { status: 500 });
        }

        const apiKey = process.env.NANO_BANANA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        const prompt = MAGIC_STUDIO_PROMPTS.imagePrompt(
            characters,
            backgroundType,
            backgroundDesc,
            elements
        );

        const models = [
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview"
        ];

        // Prepare parts for Gemini
        const portraitParts = characters.map((char: any) => ({
            inline_data: {
                mime_type: "image/png",
                data: char.image.split(",")[1],
            },
        }));

        const bgPart = customBg ? [{
            inline_data: {
                mime_type: "image/png",
                data: customBg.split(",")[1],
            },
        }] : [];

        const promptPart = [{ text: prompt }];

        const parts = [...promptPart, ...portraitParts, ...bgPart];

        let finalResult: any = null;
        let lastError: any = null;

        for (const modelId of models) {
            console.log(`\n========= Attempting Magic Generation =========`);
            console.log(`Model: ${modelId}`);
            console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
            console.log(`Characters count: ${characters.length}`);

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

            try {
                const payload = {
                    contents: [{ parts }],
                    generationConfig: {
                        response_modalities: ["IMAGE"]
                    }
                };

                console.log(`Payload parts count: ${parts.length}`);
                console.log(`Request endpoint: ${endpoint.replace(apiKey, 'API_KEY_HIDDEN')}`);

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                console.log(`Response status: ${response.status}`);

                if (response.ok) {
                    finalResult = data;
                    console.log(`✅ Successfully generated Magic Draft using ${modelId}`);
                    break;
                } else {
                    console.error(`❌ Magic Model ${modelId} failed with status ${response.status}`);
                    console.error(`Error message:`, data.error?.message || "Unknown error");
                    console.error(`Full error details:`, JSON.stringify(data, null, 2));
                    lastError = data.error?.message || `Model ${modelId} failed`;
                }
            } catch (err: any) {
                console.error(`❌ Magic Fetch error for ${modelId}:`, err.message);
                console.error(`Stack trace:`, err.stack);
                lastError = err.message;
            }
        }

        if (!finalResult) {
            return NextResponse.json({ error: lastError || "Draft generation failed" }, { status: 500 });
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

        // 3. 生成成功，扣减次数
        console.log(`[Magic Generation] Generation successful, consuming usage for user ${userId}`);

        try {
            const consumeResponse = await fetch(`${apiUrl}/api/usage/consume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    featureKey,
                    count: 1
                })
            });

            if (!consumeResponse.ok) {
                const consumeData = await consumeResponse.json();
                console.error(`[Magic Generation] Failed to consume usage:`, consumeData);
                // 即使扣减失败也返回图片，但记录错误
            } else {
                const consumeData = await consumeResponse.json();
                console.log(`[Magic Generation] Usage consumed successfully:`, consumeData);
            }
        } catch (error: any) {
            console.error(`[Magic Generation] Consume usage failed:`, error);
            // 即使扣减失败也返回图片，但记录错误
        }

        return NextResponse.json({
            imageUrl: `data:${mimeType};base64,${base64Image}`
        });

    } catch (error: any) {
        console.error("Magic API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
