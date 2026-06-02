import express, { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';

const router = express.Router();

const VALID_CONTEXTS = new Set(['site-theme', 'template']);
const VALID_PAGES = new Set(['home', 'about', 'poke', 'footer', 'global']);
const VALID_SECTIONS = new Set([
    'hero',
    'red-brand',
    'gallery',
    'pet',
    'ootd',
    'inspiration',
    'announcement',
    'about',
    'poke',
    'footer',
    'theme',
    'template',
]);

function slugify(value: unknown, fallback: string) {
    if (typeof value !== 'string') return fallback;
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || fallback;
}

function parseBase64File(file: unknown) {
    if (typeof file !== 'string' || !file.trim()) {
        throw new Error('file is required');
    }

    const dataUrlMatch = file.match(/^data:([^;]+);base64,(.+)$/);
    const base64 = dataUrlMatch ? dataUrlMatch[2] : file;
    return Buffer.from(base64, 'base64');
}

// POST /api/admin/uploads
router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            file,
            fileName = `upload-${Date.now()}.png`,
            context = 'site-theme',
            page = 'global',
            section = 'theme',
            field = 'image',
        } = req.body;

        const safeContext = slugify(context, 'site-theme');
        const safePage = slugify(page, 'global');
        const safeSection = slugify(section, 'theme');
        const safeField = slugify(field, 'image');

        if (!VALID_CONTEXTS.has(safeContext)) {
            return res.status(400).json({ error: 'invalid upload context' });
        }
        if (!VALID_PAGES.has(safePage)) {
            return res.status(400).json({ error: 'invalid upload page' });
        }
        if (!VALID_SECTIONS.has(safeSection)) {
            return res.status(400).json({ error: 'invalid upload section' });
        }

        const buffer = parseBase64File(file);
        const uploadResult = await storage.upload({
            file: buffer,
            fileName,
            appId: 'bacc',
            storagePrefix: `bacc/${safeContext}/${safePage}/${safeSection}`,
            tags: ['admin', safeContext, safePage, safeSection, safeField],
            metadata: {
                source: 'admin',
                context: safeContext,
                page: safePage,
                section: safeSection,
                field: safeField,
            },
            createdBy: 'admin',
        });

        res.status(201).json({
            id: uploadResult.id,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            storageKey: uploadResult.storageKey,
            fileName: uploadResult.fileName,
            mimeType: uploadResult.mimeType,
            width: uploadResult.width,
            height: uploadResult.height,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
