import { BaseGenerator } from './base-generator.js';
import { HANFU_PROMPTS, MAGIC_STUDIO_PROMPTS } from '../prompts.js';
import { storage } from '../storage.js';

/**
 * Portrait Studio Generator
 * Handles both simple (single photo) and complex (multi-photo) portrait generation
 */
export class PortraitGenerator extends BaseGenerator {
    async generate(payload: {
        // 生成模式
        mode: 'single' | 'multi';
        userId: string;

        // 单人模式参数
        image?: string;
        style?: string;

        // 多人模式参数
        characters?: Array<{ image: string; styleId: string }>;
        backgroundType?: 'preset' | 'custom';
        backgroundDesc?: string;
        elements?: string;
        customBg?: string;
    }): Promise<{ imageUrl: string; thumbnailUrl?: string; fileId: string }> {
        const { mode, userId } = payload;

        console.log(`[PortraitGenerator] Starting ${mode} mode generation for user ${userId}`);

        if (mode === 'single') {
            return this.generateSinglePortrait(payload);
        } else {
            return this.generateMultiPortrait(payload);
        }
    }

    /**
     * 单人肖像生成（原 Hanfu Generation）
     */
    private async generateSinglePortrait(payload: {
        image?: string;
        style?: string;
        userId: string;
    }): Promise<{ imageUrl: string; thumbnailUrl?: string; fileId: string }> {
        const { image, style, userId } = payload;

        if (!image || !style) {
            throw new Error('Image and style are required for single portrait mode');
        }

        console.log(`[PortraitGenerator] Single portrait: style=${style}`);

        // 构建 prompt
        const prompt = HANFU_PROMPTS[style] || HANFU_PROMPTS.tang;
        const defaultText = HANFU_PROMPTS.defaultText;

        // 获取 base64 数据（支持 URL 和 base64）
        const base64Data = await this.getBase64FromImageSource(image);

        // 调用 Gemini API
        const models = this.getModels('NANO_BANANA_PORTRAIT_SINGLE_MODELS');

        const { base64Image, mimeType } = await this.callGeminiAPI(models, (modelId) => {
            const payload: any = {
                contents: [
                    {
                        parts: [
                            { text: `${prompt} ${defaultText}` },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: base64Data,
                                },
                            },
                        ],
                    },
                ],
            };

            if (modelId.includes('image') || modelId.includes('preview')) {
                payload.generationConfig = { response_modalities: ['IMAGE'] };
            }

            return payload;
        });

        return this.uploadToR2(base64Image, mimeType, userId, 'single', { style });
    }

    /**
     * 多人合成生成（原 Magic Generation）
     */
    private async generateMultiPortrait(payload: {
        characters?: Array<{ image: string; styleId: string }>;
        backgroundType?: 'preset' | 'custom';
        backgroundDesc?: string;
        elements?: string;
        customBg?: string;
        userId: string;
    }): Promise<{ imageUrl: string; thumbnailUrl?: string; fileId: string }> {
        const { characters, backgroundType, backgroundDesc, elements, customBg, userId } = payload;

        if (!characters || !backgroundType || !backgroundDesc || !elements) {
            throw new Error('Characters, backgroundType, backgroundDesc, and elements are required');
        }

        console.log(`[PortraitGenerator] Multi portrait: ${characters.length} characters`);

        // 构建 prompt
        const prompt = MAGIC_STUDIO_PROMPTS.imagePrompt(
            characters,
            backgroundType,
            backgroundDesc,
            elements
        );

        // 准备图片部分 - 支持 URL 和 base64
        const portraitParts = await Promise.all(
            characters.map(async (char) => {
                const base64Data = await this.getBase64FromImageSource(char.image);
                return {
                    inline_data: {
                        mime_type: 'image/png',
                        data: base64Data,
                    },
                };
            })
        );

        const bgPart = customBg
            ? [
                {
                    inline_data: {
                        mime_type: 'image/png',
                        data: await this.getBase64FromImageSource(customBg),
                    },
                },
            ]
            : [];

        const promptPart = [{ text: prompt }];
        const parts = [...promptPart, ...portraitParts, ...bgPart];

        // 调用 Gemini API
        const models = this.getModels('NANO_BANANA_PORTRAIT_MULTI_MODELS');

        const { base64Image, mimeType } = await this.callGeminiAPI(models, (modelId) => {
            const payload: any = {
                contents: [{ parts }],
            };

            if (modelId.includes('image') || modelId.includes('preview')) {
                payload.generationConfig = { response_modalities: ['IMAGE'] };
            }

            return payload;
        });

        return this.uploadToR2(base64Image, mimeType, userId, 'multi', {
            backgroundType,
            charactersCount: characters.length,
        });
    }

    /**
     * 从图片源（URL 或 base64）获取 base64 数据
     */
    private async getBase64FromImageSource(imageSource: string): Promise<string> {
        // 如果是 base64，直接提取
        if (imageSource.startsWith('data:image/')) {
            const base64Data = imageSource.split(',')[1];
            if (!base64Data) {
                throw new Error('Invalid base64 image format');
            }
            return base64Data;
        }

        // 如果是 URL，下载并转换为 base64
        if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
            console.log(`[PortraitGenerator] Downloading image from URL: ${imageSource.substring(0, 50)}...`);
            const response = await fetch(imageSource);
            if (!response.ok) {
                throw new Error(`Failed to download image from URL: ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            return Buffer.from(buffer).toString('base64');
        }

        throw new Error('Image source must be either a data URL or HTTP(S) URL');
    }

    /**
     * 上传到 R2（复用逻辑）
     */
    private async uploadToR2(
        base64Image: string,
        mimeType: string,
        userId: string,
        mode: 'single' | 'multi',
        metadata: any
    ): Promise<{ imageUrl: string; thumbnailUrl?: string; fileId: string }> {
        console.log(`[PortraitGenerator] Uploading to R2 for user ${userId}`);
        const imageBuffer = Buffer.from(base64Image, 'base64');

        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `portrait-${mode}-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['portrait', mode, 'generated'],
            metadata: {
                mode,
                ...metadata,
            },
            createdBy: userId.toString(),
            userId: userId.toString(), // 传递 userId
            generationType: 'portrait', // ✅ 作为独立字段传递
        });

        console.log(`[PortraitGenerator] Upload complete: ${uploadResult.url}`);

        return {
            imageUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id,
        };
    }
}
