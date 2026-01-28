import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { image, style } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const apiKey = process.env.NANO_BANANA_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured" }, { status: 500 });
        }

        const base64Data = image.split(",")[1];

        // Use centralized prompts
        const { HANFU_PROMPTS } = await import("@/config/prompts");
        const prompt = HANFU_PROMPTS[style] || HANFU_PROMPTS.tang;
        const defaultText = HANFU_PROMPTS.defaultText;

        // Try both image-specific and general models
        const models = [
            "gemini-2.5-flash-image",
            "gemini-2.0-flash-exp-image-generation",
            "gemini-3-pro-image-preview",
            "gemini-1.5-flash",
        ];

        let finalResult: any = null;
        let lastError: any = null;

        for (const modelId of models) {
            console.log(`Attempting generation with model: ${modelId}...`);
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

            try {
                // Experimental: 2.0 and some others might fail with response_modalities
                // We'll try a flexible payload
                const payload: any = {
                    contents: [
                        {
                            parts: [
                                { text: `${prompt} ${defaultText}` },
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

                // Add modalities ONLY for known supporting models or if it's the 1st try
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
                    console.log(`Successfully generated using ${modelId}`);
                    break;
                } else {
                    console.error(`Model ${modelId} failed (${response.status}):`, data.error?.message || "Unknown error");
                    lastError = data.error?.message || `Model ${modelId} failed`;
                }
            } catch (err: any) {
                console.error(`Fetch error for ${modelId}:`, err.message);
                lastError = err.message;
            }
        }

        if (!finalResult) {
            return NextResponse.json({ error: lastError || "AI generation failed" }, { status: 500 });
        }

        // Exhaustive search for image data in result candidates
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
        } catch (e) {
            console.error("Extraction logic crash:", e);
        }

        if (!base64Image) {
            console.error("Critical: Could not find image in successful response. Keys:", Object.keys(finalResult));
            return NextResponse.json({ error: "No image found in AI response" }, { status: 500 });
        }

        console.log(`Extraction SUCCESS. Mime: ${mimeType}, Size: ${base64Image.length}`);

        return NextResponse.json({
            image: `data:${mimeType};base64,${base64Image}`
        });
    } catch (error: any) {
        console.error("Hanfu API Route Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
