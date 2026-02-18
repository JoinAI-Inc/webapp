const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export abstract class BaseGenerator {
    protected apiKey: string;
    protected baseUrl: string;

    constructor() {
        this.apiKey = process.env.NANO_BANANA_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('NANO_BANANA_API_KEY not configured');
        }
        this.baseUrl = (process.env.NANO_BANANA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
    }

    /**
     * 从环境变量读取模型列表
     */
    protected getModels(envKey: string): string[] {
        const raw = process.env[envKey] || '';
        return raw.split(',').map((m) => m.trim()).filter(Boolean);
    }

    /**
     * 执行生成（子类实现）
     */
    abstract generate(payload: any): Promise<{
        imageUrl?: string;
        thumbnailUrl?: string;
        fileId?: string;
    }>;

    /**
     * 通用的 Gemini API 调用（支持多模型回退）
     */
    protected async callGeminiAPI(
        models: string[],
        payloadFn: (modelId: string) => any
    ): Promise<{ base64Image: string; mimeType: string }> {
        let lastError: any = null;

        console.log(`[Generator] baseUrl: ${this.baseUrl}`);
        console.log(`[Generator] Models to try (${models.length}): ${models.join(', ')}`);

        for (const modelId of models) {
            const endpoint = `${this.baseUrl}/models/${modelId}:generateContent`;
            // 日志中隐藏 key
            const logUrl = `${this.baseUrl}/models/${modelId}:generateContent`;
            console.log(`[Generator] Trying model: ${modelId} → ${logUrl}`);

            try {
                const payload = payloadFn(modelId);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data: any = await response.json();

                if (response.ok) {
                    const result = this.extractImage(data);
                    if (result) {
                        console.log(`[Generator] ✅ Success with ${modelId}`);
                        return result;
                    } else {
                        console.warn(`[Generator] ⚠️ ${modelId} responded OK but no image found in response`);
                        lastError = `${modelId}: no image in response`;
                    }
                } else {
                    const errMsg = data.error?.message || JSON.stringify(data.error) || 'Unknown error';
                    console.error(`[Generator] ❌ ${modelId} failed (HTTP ${response.status}): ${errMsg}`);
                    lastError = errMsg;
                }
            } catch (err: any) {
                console.error(`[Generator] ❌ ${modelId} fetch error: ${err.message}`);
                lastError = err.message;
            }
        }

        console.error(`[Generator] All ${models.length} models failed. Last error: ${lastError}`);
        throw new Error(lastError || 'All models failed');
    }


    /**
     * 从响应中提取图片数据
     */
    private extractImage(data: any): { base64Image: string; mimeType: string } | null {
        try {
            const candidates = data.candidates || [];
            for (const cand of candidates) {
                const parts = cand.content?.parts || cand.parts || [];
                for (const part of parts) {
                    const img = part.inline_data || part.inlineData;
                    if (img?.data) {
                        return {
                            base64Image: img.data,
                            mimeType: img.mime_type || img.mimeType || 'image/png',
                        };
                    }
                }
            }
        } catch (e) {
            console.error('[Generator] Image extraction error:', e);
        }
        return null;
    }
}

