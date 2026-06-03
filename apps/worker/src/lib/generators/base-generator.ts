import axios from 'axios';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function estimateBase64Bytes(base64Data: string): number {
    const clean = base64Data.replace(/\s/g, '');
    const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor(clean.length * 3 / 4) - padding);
}

function summarizeGeminiPayload(payload: any) {
    const contents = Array.isArray(payload?.contents) ? payload.contents : [];
    const images: Array<{
        contentIndex: number;
        partIndex: number;
        mimeType: string;
        base64Chars: number;
        approxBytes: number;
        approxMB: string;
    }> = [];
    let partCount = 0;
    let textParts = 0;
    let textChars = 0;

    contents.forEach((content: any, contentIndex: number) => {
        const parts = Array.isArray(content?.parts) ? content.parts : [];
        partCount += parts.length;

        parts.forEach((part: any, partIndex: number) => {
            if (typeof part?.text === 'string') {
                textParts++;
                textChars += part.text.length;
            }

            const inlineImage = part?.inline_data || part?.inlineData;
            if (typeof inlineImage?.data === 'string') {
                const approxBytes = estimateBase64Bytes(inlineImage.data);
                images.push({
                    contentIndex,
                    partIndex,
                    mimeType: inlineImage.mime_type || inlineImage.mimeType || 'unknown',
                    base64Chars: inlineImage.data.length,
                    approxBytes,
                    approxMB: (approxBytes / 1024 / 1024).toFixed(2),
                });
            }
        });
    });

    return {
        contentCount: contents.length,
        partCount,
        textParts,
        textChars,
        imageParts: images.length,
        images,
        generationConfig: payload?.generationConfig ?? null,
    };
}

function summarizeAxiosError(err: any) {
    return {
        message: err?.message,
        code: err?.code,
        errno: err?.errno,
        syscall: err?.syscall,
        address: err?.address,
        port: err?.port,
        status: err?.response?.status,
        timeout: err?.config?.timeout,
        maxBodyLength: err?.config?.maxBodyLength,
        cause: err?.cause ? {
            message: err.cause.message,
            code: err.cause.code,
            errno: err.cause.errno,
            syscall: err.cause.syscall,
            address: err.cause.address,
            port: err.cause.port,
        } : undefined,
        responseData: err?.response?.data
            ? JSON.stringify(err.response.data).substring(0, 1000)
            : undefined,
    };
}

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
     * 通用的 Gemini API 调用（支持多模型回退），使用 axios 以支持大响应体
     */
    protected async callGeminiAPI(
        models: string[],
        payloadFn: (modelId: string) => any,
        options: { baseUrl?: string; timeoutMs?: number } = {}
    ): Promise<{ base64Image: string; mimeType: string }> {
        let lastError: any = null;
        const baseUrl = (options.baseUrl || this.baseUrl).replace(/\/$/, '');

        if (models.length === 0) {
            throw new Error('No image generation models configured');
        }

        console.log(`[Generator] baseUrl: ${baseUrl}`);
        console.log(`[Generator] Models to try (${models.length}): ${models.join(', ')}`);

        for (const modelId of models) {
            const endpoint = `${baseUrl}/models/${modelId}:generateContent`;
            console.log(`[Generator] Trying model: ${modelId} → ${endpoint}`);

            try {
                const payload = payloadFn(modelId);
                const payloadJson = JSON.stringify(payload);
                const payloadBytes = Buffer.byteLength(payloadJson);
                console.log(`[Generator] Request payload size: ${(payloadBytes / 1024 / 1024).toFixed(2)} MB (${payloadBytes} bytes)`);
                console.log(`[Generator] Request payload summary: ${JSON.stringify(summarizeGeminiPayload(payload))}`);

                const response = await axios.post(endpoint, payloadJson, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': String(payloadBytes),
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    timeout: options.timeoutMs ?? 1_200_000,  // 默认 20 分钟
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    validateStatus: () => true,  // 不抛 HTTP 错误，手动判断
                });

                const data = response.data;

                if (response.status >= 200 && response.status < 300) {
                    const result = this.extractImage(data);
                    if (result) {
                        console.log(`[Generator] ✅ Success with ${modelId}`);
                        return result;
                    } else {
                        console.warn(`[Generator] ⚠️ ${modelId} responded OK but no image found in response`);
                        console.warn(`[Generator] Response data: ${JSON.stringify(data).substring(0, 300)}`);
                        lastError = `${modelId}: no image in response`;
                    }
                } else {
                    const errMsg = data?.error?.message || JSON.stringify(data?.error) || 'Unknown error';
                    console.error(`[Generator] ❌ ${modelId} failed (HTTP ${response.status}): ${errMsg}`);
                    lastError = errMsg;
                }
            } catch (err: any) {
                const msg = err.code === 'ECONNABORTED'
                    ? `timeout after 20min`
                    : err.message;
                console.error(`[Generator] ❌ ${modelId} request error: ${msg}`);
                console.error(`[Generator] Request error detail: ${JSON.stringify(summarizeAxiosError(err))}`);
                lastError = msg;
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
