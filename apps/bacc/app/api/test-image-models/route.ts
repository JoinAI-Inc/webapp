import { NextRequest, NextResponse } from "next/server";

/**
 * 测试多个图像生成模型的可用性
 * 访问: http://localhost:3003/api/test-image-models
 */
export async function GET(req: NextRequest) {
    const apiKey = process.env.NANO_BANANA_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });
    }

    const testModels = [
        "gemini-2.5-flash-image",
        "gemini-3-pro-image-preview",
        "gemini-2.0-flash-exp-image-generation",
        "gemini-2.0-flash-preview-image-generation",
        "imagen-3.0-generate-001",
        "imagen-3.0-generate-002"
    ];

    const results = [];

    for (const modelId of testModels) {
        console.log(`Testing model: ${modelId}...`);

        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{
                    parts: [
                        { text: "Generate a simple red circle" }
                    ]
                }],
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

            results.push({
                model: modelId,
                status: response.status,
                available: response.ok,
                error: response.ok ? null : data.error?.message || "Unknown error"
            });

        } catch (err: any) {
            results.push({
                model: modelId,
                status: 0,
                available: false,
                error: err.message
            });
        }
    }

    const availableModels = results.filter(r => r.available);
    const unavailableModels = results.filter(r => !r.available);

    return NextResponse.json({
        summary: {
            total: testModels.length,
            available: availableModels.length,
            unavailable: unavailableModels.length
        },
        availableModels,
        unavailableModels,
        recommendation: availableModels.length > 0
            ? `建议使用: ${availableModels[0].model}`
            : "❌ 没有可用的图像生成模型，建议检查 API Key 权限或使用 Mock 数据"
    });
}
