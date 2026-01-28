import { NextRequest, NextResponse } from "next/server";

/**
 * 测试 Gemini API Key 连通性
 * 访问: http://localhost:3003/api/test-gemini
 */
export async function GET(req: NextRequest) {
    try {
        const apiKey = process.env.NANO_BANANA_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "API Key 未配置"
            }, { status: 500 });
        }

        console.log("Testing Gemini API Key...");
        console.log("API Key (前8位):", apiKey.substring(0, 8) + "...");

        // 测试标准的 Gemini 文本生成模型（稳定可靠）
        const testModel = "gemini-2.0-flash";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{
                    text: "Say hello"
                }]
            }]
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json({
                success: true,
                message: "✅ API Key 有效！文本生成模型可用",
                model: testModel,
                response: data.candidates?.[0]?.content?.parts?.[0]?.text || "OK"
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "❌ API 调用失败",
                status: response.status,
                error: data.error?.message || "Unknown error",
                details: data
            }, { status: response.status });
        }

    } catch (error: any) {
        console.error("Test Gemini API Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error",
            stack: error.stack
        }, { status: 500 });
    }
}
