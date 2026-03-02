import { BaseGenerator } from './base-generator.js';
import { storage } from '../storage.js';

export interface TemplateSlotInput {
    slotType: string;     // IMAGE | BACKGROUND | PERSON 等
    refId: string;        // 对应模板 slot 的 refId
    imageSource: string;  // base64 data URL 或 https URL
}

export interface TemplateGeneratePayload {
    userId: string;
    templateId: string;
    templateName: string;
    descriptor: any;       // 模板的完整 prompt descriptor (可能是 JSON 对象)
    slots: TemplateSlotInput[];
}

/**
 * Template Generator
 * 根据模板 descriptor + 用户上传 slot 图片调用 Gemini 生成图像
 */
export class TemplateGenerator extends BaseGenerator {
    async generate(payload: TemplateGeneratePayload): Promise<{
        imageUrl: string;
        thumbnailUrl?: string;
        fileId: string;
    }> {
        const { userId, templateId, templateName, descriptor, slots } = payload;

        if (!descriptor) {
            throw new Error('Template descriptor is required');
        }
        if (!slots || slots.length === 0) {
            throw new Error('At least one slot image is required');
        }

        console.log(`[TemplateGenerator] Generating for template "${templateName}" (${templateId}), userId=${userId}, slots=${slots.length}`);

        // 每个 slot 图片转为 base64
        const imageParts = await Promise.all(
            slots.map(async (slot) => {
                const { base64Data, mimeType } = await this.getBase64FromSource(slot.imageSource);
                return {
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data,
                    },
                };
            })
        );

        const models = this.getModels('NANO_BANANA_PORTRAIT_SINGLE_MODELS');
        
        const promptText = typeof descriptor === 'string' ? descriptor : JSON.stringify(descriptor);

        const { base64Image, mimeType } = await this.callGeminiAPI(models, (modelId) => {
            const body: any = {
                contents: [
                    {
                        parts: [
                            { text: promptText },
                            ...imageParts,
                        ],
                    },
                ],
            };

            if (modelId.includes('image') || modelId.includes('preview')) {
                body.generationConfig = { response_modalities: ['IMAGE'] };
            }

            return body;
        });

        // 上传到 R2
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `template-${templateId}-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['template', 'generated'],
            metadata: { templateId, templateName },
            createdBy: userId,
            userId,
            generationType: 'template',
        });

        console.log(`[TemplateGenerator] Upload complete: ${uploadResult.url}`);

        return {
            imageUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id,
        };
    }

    private async getBase64FromSource(src: string): Promise<{ base64Data: string; mimeType: string }> {
        if (src.startsWith('data:image/')) {
            // 从 data URL 解析 mimeType，如 data:image/jpeg;base64,...
            const mimeType = src.substring(5, src.indexOf(';')) || 'image/png';
            const base64Data = src.split(',')[1];
            if (!base64Data) throw new Error('Invalid base64 image');
            return { base64Data, mimeType };
        }
        if (src.startsWith('http://') || src.startsWith('https://')) {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
            const mimeType = resp.headers.get('content-type')?.split(';')[0] || 'image/png';
            const buf = await resp.arrayBuffer();
            return { base64Data: Buffer.from(buf).toString('base64'), mimeType };
        }
        throw new Error('imageSource must be a data URL or HTTPS URL');
    }
}
