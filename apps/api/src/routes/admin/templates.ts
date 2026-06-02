import express, { Request, Response } from 'express';
import { prisma } from '@repo/database';
import type { Prisma } from '@prisma/client';

const router = express.Router();

const templateInclude: Prisma.TemplateInclude = {
    tags: { include: { tag: true } },
    slots: {
        orderBy: { sortOrder: 'asc' },
        include: {
            assets: {
                include: { asset: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    }
};

// GET /api/admin/templates
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, page = '1', pageSize = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page as string));
        const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
        const skip = (pageNum - 1) * sizeNum;

        const where: Prisma.TemplateWhereInput = {};
        if (status) where.status = status as any;

        const [templates, total] = await Promise.all([
            prisma.template.findMany({
                where, skip, take: sizeNum, orderBy: { createdAt: 'desc' },
                include: templateInclude
            }),
            prisma.template.count({ where })
        ]);

        res.json({ data: templates, total, page: pageNum, pageSize: sizeNum });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// GET /api/admin/templates/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const template = await prisma.template.findUnique({
            where: { id: req.params.id },
            include: templateInclude
        });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json(template);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// POST /api/admin/templates
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            name,
            imageId,
            imageUrl,
            descriptor,
            tagIds = [],
            slots = [],
            status,
            generationFeatureKey,
            promptPolicyKey,
            promptPolicyVersion,
        } = req.body;
        if (!name || !imageUrl || !descriptor || !generationFeatureKey) {
            return res.status(400).json({ error: 'name, imageUrl, descriptor, generationFeatureKey are required' });
        }

        const resolution = descriptor.resolution ?? null;
        const theme = descriptor.global_config?.theme ?? null;

        const template = await prisma.template.create({
            data: {
                id: crypto.randomUUID(), name, imageId: imageId ?? null, imageUrl,
                descriptor, resolution, theme, status: status ?? 'DRAFT',
                generationFeatureKey: generationFeatureKey || null,
                promptPolicyKey: promptPolicyKey || 'template-default',
                promptPolicyVersion: promptPolicyVersion === undefined ? 1 : (promptPolicyVersion ? Number(promptPolicyVersion) : null),
                tags: { create: (tagIds as string[]).map((tagId: string) => ({ tagId })) },
                slots: {
                    create: (slots as any[]).map((s: any, i: number) => {
                        const slotData: any = {
                            id: crypto.randomUUID(), slotType: s.slotType, refId: s.refId,
                            label: s.label, description: s.description ?? null, sortOrder: s.sortOrder ?? i
                        };
                        if (s.assetIds && s.assetIds.length > 0) {
                            slotData.assets = {
                                create: s.assetIds.map((aId: string, aIdx: number) => ({
                                    assetId: aId, sortOrder: aIdx
                                }))
                            };
                        }
                        return slotData;
                    })
                }
            } as any,
            include: templateInclude
        });
        res.status(201).json(template);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// PUT /api/admin/templates/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            imageId,
            imageUrl,
            descriptor,
            tagIds,
            slots,
            status,
            generationFeatureKey,
            promptPolicyKey,
            promptPolicyVersion,
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (imageId !== undefined) updateData.imageId = imageId;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (status !== undefined) updateData.status = status;
        if (generationFeatureKey !== undefined) updateData.generationFeatureKey = generationFeatureKey || null;
        if (promptPolicyKey !== undefined) updateData.promptPolicyKey = promptPolicyKey || null;
        if (promptPolicyVersion !== undefined) updateData.promptPolicyVersion = promptPolicyVersion ? Number(promptPolicyVersion) : null;
        if (descriptor !== undefined) {
            updateData.descriptor = descriptor;
            updateData.resolution = descriptor.resolution ?? null;
            updateData.theme = descriptor.global_config?.theme ?? null;
        }

        if (tagIds !== undefined) {
            await prisma.templateTag.deleteMany({ where: { templateId: id } });
            if (tagIds.length > 0) {
                await prisma.templateTag.createMany({ data: (tagIds as string[]).map((tagId: string) => ({ templateId: id, tagId })) });
            }
        }

        if (slots !== undefined) {
            await prisma.templateSlot.deleteMany({ where: { templateId: id } });
            if (slots.length > 0) {
                // Must create individually to support nested 'assets' logic
                for (let i = 0; i < slots.length; i++) {
                    const s = slots[i];
                    const slotData: any = {
                        id: crypto.randomUUID(), templateId: id, slotType: s.slotType, refId: s.refId,
                        label: s.label, description: s.description ?? null, sortOrder: s.sortOrder ?? i
                    };
                    
                    if (s.assetIds && s.assetIds.length > 0) {
                        slotData.assets = {
                            create: s.assetIds.map((assetId: string, idx: number) => ({
                                assetId,
                                sortOrder: idx
                            }))
                        };
                    }
                    await prisma.templateSlot.create({ data: slotData });
                }
            }
        }

        const template = await prisma.template.update({
            where: { id }, data: updateData,
            include: templateInclude
        });
        res.json(template);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// DELETE /api/admin/templates/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await prisma.template.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});



export default router;
