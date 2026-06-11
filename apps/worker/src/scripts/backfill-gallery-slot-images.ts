import { prisma } from "@repo/database";
import {
    getMissingGallerySlotSources,
    mergeGallerySlotImages,
} from "../lib/generators/gallery-slot-backfill.js";
import { createGallerySlotImages } from "../lib/generators/template-slot-images.js";

const WRITE_CHANGES = process.argv.includes("--write");
const BATCH_SIZE = 20;

async function main() {
    let cursor: string | undefined;
    let scanned = 0;
    let candidates = 0;
    let updated = 0;
    let skippedInvalid = 0;

    while (true) {
        const rows = await prisma.mediaFile.findMany({
            where: {
                appId: "bacc",
                generationType: "template",
                status: "active",
            },
            orderBy: { id: "asc" },
            take: BATCH_SIZE,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: {
                id: true,
                metadata: true,
                promptData: true,
            },
        });

        if (rows.length === 0) break;

        for (const row of rows) {
            scanned += 1;
            const sources = getMissingGallerySlotSources(row);
            if (sources.length === 0) continue;

            candidates += 1;
            const slotImages = await createGallerySlotImages(
                sources.map((imageSource) => ({ imageSource })),
            );

            if (slotImages.length === 0) {
                skippedInvalid += 1;
                continue;
            }

            if (WRITE_CHANGES) {
                await prisma.mediaFile.update({
                    where: { id: row.id },
                    data: {
                        metadata: mergeGallerySlotImages(row.metadata, slotImages),
                    },
                });
                updated += 1;
            }
        }

        cursor = rows.at(-1)?.id;
    }

    console.log(JSON.stringify({
        mode: WRITE_CHANGES ? "write" : "dry-run",
        scanned,
        candidates,
        updated,
        skippedInvalid,
    }, null, 2));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
