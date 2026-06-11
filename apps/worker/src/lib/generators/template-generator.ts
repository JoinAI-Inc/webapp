import { BaseGenerator } from './base-generator.js';
import { storage } from '../storage.js';
import sharp from 'sharp';
import { createGallerySubjects } from './gallery-subjects.js';
import { createGallerySlotImages } from './template-slot-images.js';

const INPUT_IMAGE_MAX_DIMENSION = parseInt(process.env.TEMPLATE_INPUT_IMAGE_MAX_DIMENSION || '1536', 10);
const INPUT_IMAGE_JPEG_QUALITY = parseInt(process.env.TEMPLATE_INPUT_IMAGE_JPEG_QUALITY || '82', 10);

interface TemplateRuntimeGenerationConfig {
    promptPolicy?: {
        templateContextInstruction?: string;
        slotContextInstruction?: string;
        personInstruction?: string;
        ootdInstruction?: string;
        decorationInstruction?: string;
        finalCheckInstruction?: string;
    };
}

export interface TemplateSlotInput {
    slotType: string;     // PERSON | OOTD | DECORATION
    refId: string;        // 对应模板 slot 的 refId
    imageSource: string;  // base64 data URL 或 https URL
    assetPayload?: any;
    gender?: unknown;
    makeup?: unknown;
}

export interface TemplateGeneratePayload {
    userId: string;
    templateId: string;
    templateName: string;
    templateImageUrl?: string;   // 模板原图 URL（第1张参考图）
    descriptor: any;             // 模板的完整 descriptor JSON 对象
    slots: TemplateSlotInput[];
    generationConfig?: TemplateRuntimeGenerationConfig;
}

function renderTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
        const value = variables[key];
        return value === undefined || value === null ? '' : String(value);
    });
}

function getPayloadImageSource(payload: unknown): string | undefined {
    if (typeof payload === 'string') {
        return payload.trim() || undefined;
    }
    if (!payload || typeof payload !== 'object') {
        return undefined;
    }

    const data = payload as Record<string, unknown>;
    const candidates = [
        data.imageSource,
        data.imageUrl,
        data.url,
        data.sourceUrl,
    ];

    return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

/**
 * 根据 descriptor 和用户填充的 slot，构建 Gemini 的自然语言 prompt。
 *
 * 图片顺序约定：
 *   第 1 张图（如果有 templateImageUrl）= 模板原图
 *   第 2 张起 = 用户上传的 slot 参考图（与 slots 数组顺序一致）
 */
function getPolicyText(promptPolicy: TemplateRuntimeGenerationConfig['promptPolicy'], key: keyof NonNullable<TemplateRuntimeGenerationConfig['promptPolicy']>): string {
    const value = promptPolicy?.[key];
    return typeof value === 'string' ? value.trim() : '';
}

function stringifyPromptJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
}

function sanitizeAssetPayload(payload: unknown): unknown {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload ?? null;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        if (['imageSource', 'imageUrl', 'url', 'sourceUrl', 'thumbnailUrl'].includes(key)) continue;
        result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : null;
}

function buildSlotContext(slots: TemplateSlotInput[]) {
    return slots.map((slot, index) => ({
        slotType: slot.slotType,
        refId: slot.refId,
        imageNo: index + 2,
        imageRef: `第${index + 2}张参考图`,
        assetPayload: sanitizeAssetPayload(slot.assetPayload),
    }));
}

function buildPromptFromDescriptor(
    descriptor: any,
    slots: TemplateSlotInput[],
    promptPolicy: TemplateRuntimeGenerationConfig['promptPolicy'] = {}
): string {
    const desc = typeof descriptor === 'string' ? JSON.parse(descriptor) : descriptor;
    const slotContext = buildSlotContext(slots);
    const personSlots = slotContext.filter((slot) => slot.slotType === 'PERSON');
    const ootdSlots = slotContext.filter((slot) => slot.slotType === 'OOTD');
    const decorationSlots = slotContext.filter((slot) => slot.slotType === 'DECORATION');
    const variables = {
        templateJson: stringifyPromptJson(desc),
        slotsJson: stringifyPromptJson(slotContext),
        personSlotsJson: stringifyPromptJson(personSlots),
        ootdSlotsJson: stringifyPromptJson(ootdSlots),
        decorationSlotsJson: stringifyPromptJson(decorationSlots),
    };

    const lines: string[] = [];
    const templateContextInstruction = getPolicyText(promptPolicy, 'templateContextInstruction');
    const slotContextInstruction = getPolicyText(promptPolicy, 'slotContextInstruction');
    const personInstruction = getPolicyText(promptPolicy, 'personInstruction');
    const ootdInstruction = getPolicyText(promptPolicy, 'ootdInstruction');
    const decorationInstruction = getPolicyText(promptPolicy, 'decorationInstruction');
    const finalCheckInstruction = getPolicyText(promptPolicy, 'finalCheckInstruction');

    if (templateContextInstruction) lines.push(renderTemplate(templateContextInstruction, variables));
    if (slotContextInstruction) lines.push(renderTemplate(slotContextInstruction, variables));
    if (personSlots.length > 0 && personInstruction) lines.push(renderTemplate(personInstruction, variables));
    if (ootdSlots.length > 0 && ootdInstruction) lines.push(renderTemplate(ootdInstruction, variables));
    if (decorationSlots.length > 0 && decorationInstruction) lines.push(renderTemplate(decorationInstruction, variables));
    if (finalCheckInstruction) lines.push(renderTemplate(finalCheckInstruction, variables));

    return lines.join('\n');
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
        const { userId, templateId, templateName, templateImageUrl, descriptor, slots, generationConfig = {} } = payload;

        if (!descriptor) {
            throw new Error('Template descriptor is required');
        }
        if (!slots || slots.length === 0) {
            throw new Error('At least one slot image is required');
        }

        console.log(`[TemplateGenerator] Generating for template "${templateName}" (${templateId}), userId=${userId}, slots=${slots.length}`);

        // ── 构建图片列表（顺序决定 prompt 中的 "第N张图"） ──────────────────
        const imageParts: any[] = [];

        // 第1张：模板原图
        if (!templateImageUrl) {
            throw new Error('Template image is required');
        }

        if (templateImageUrl) {
            try {
                const { base64Data, mimeType } = await this.getBase64FromSource(templateImageUrl);
                imageParts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
                console.log(`[TemplateGenerator] Template image loaded (img #1)`);
            } catch (e: any) {
                throw new Error(`Failed to load template image: ${e.message}`);
            }
        }

        // 第2张起：用户上传的 slot 图（按 slots 顺序）
        for (const slot of slots) {
            const imageSource = typeof slot.imageSource === 'string' && slot.imageSource.trim().length > 0
                ? slot.imageSource.trim()
                : getPayloadImageSource(slot.assetPayload);
            if (!imageSource) {
                throw new Error(`Slot "${slot.refId || 'unknown'}" is missing imageSource`);
            }
            const { base64Data, mimeType } = await this.getBase64FromSource(imageSource);
            imageParts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
        }

        // ── 构建 prompt ─────────────────────────────────────────────────────
        const promptText = buildPromptFromDescriptor(descriptor, slots, generationConfig.promptPolicy);

        console.log(`[TemplateGenerator] Prompt (${promptText.length} chars):\n${promptText.substring(0, 500)}...`);

        const models = this.getModels('NANO_BANANA_TEMPLATE_MODELS');
        const responseModalities = ['IMAGE'];

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
                body.generationConfig = { response_modalities: responseModalities };
            }

            return body;
        });

        // ── 上传结果到 R2 ───────────────────────────────────────────────────
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const slotImages = await createGallerySlotImages(slots);
        const gallerySubjects = createGallerySubjects(slots);
        const uploadResult = await storage.upload({
            file: imageBuffer,
            fileName: `template-${templateId}-${Date.now()}.png`,
            appId: 'bacc',
            tags: ['template', 'generated'],
            metadata: { templateId, templateName, slotImages, gallerySubjects },
            createdBy: userId,
            userId,
            generationType: 'template',
            promptData: { templateId, templateName, slots },
            templateId,
        });

        console.log(`[TemplateGenerator] Upload complete: ${uploadResult.url}`);

        return {
            imageUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileId: uploadResult.id,
        };
    }

    private async getBase64FromSource(
        src: string
    ): Promise<{ base64Data: string; mimeType: string }> {
        if (typeof src !== 'string' || src.trim().length === 0) {
            throw new Error('imageSource is required');
        }

        if (src.startsWith('data:image/')) {
            const mimeType = src.substring(5, src.indexOf(';')) || 'image/png';
            const base64Data = src.split(',')[1];
            if (!base64Data) throw new Error('Invalid base64 image');
            return this.prepareImageForModel(Buffer.from(base64Data, 'base64'), mimeType);
        }
        if (src.startsWith('http://') || src.startsWith('https://')) {
            const resp = await fetch(src);
            if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
            const mimeType = resp.headers.get('content-type')?.split(';')[0] || 'image/png';
            const buf = await resp.arrayBuffer();
            return this.prepareImageForModel(Buffer.from(buf), mimeType);
        }
        throw new Error('imageSource must be a data URL or HTTPS URL');
    }

    private async prepareImageForModel(
        buffer: Buffer,
        originalMimeType: string
    ): Promise<{ base64Data: string; mimeType: string }> {
        try {
            const maxDimension = INPUT_IMAGE_MAX_DIMENSION;
            const jpegQuality = Math.min(100, INPUT_IMAGE_JPEG_QUALITY);
            const inputBytes = buffer.byteLength;
            const output = await sharp(buffer, { failOn: 'none' })
                .rotate()
                .resize({
                    width: maxDimension,
                    height: maxDimension,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: jpegQuality, mozjpeg: true })
                .toBuffer();
            const mimeType = 'image/jpeg';

            console.log(
                `[TemplateGenerator] Prepared image ${originalMimeType} ${Math.round(inputBytes / 1024)}KB -> ${mimeType} ${Math.round(output.byteLength / 1024)}KB`
            );

            return {
                base64Data: output.toString('base64'),
                mimeType,
            };
        } catch (error: any) {
            console.warn(`[TemplateGenerator] Failed to optimize image, using original: ${error.message}`);
            return {
                base64Data: buffer.toString('base64'),
                mimeType: originalMimeType || 'image/png',
            };
        }
    }
}
