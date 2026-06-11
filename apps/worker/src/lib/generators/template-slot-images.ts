import sharp from "sharp";

interface SlotImageInput {
    refId?: string;
    slotType?: string;
    imageSource: string;
}

const GALLERY_THUMBNAIL_WIDTH = 96;
const GALLERY_THUMBNAIL_HEIGHT = 136;

export async function createGallerySlotImages(slots: SlotImageInput[]): Promise<string[]> {
    const images = await Promise.all(slots.map(async ({ imageSource }) => {
        const source = imageSource.trim();
        if (source.startsWith("http://") || source.startsWith("https://")) {
            return source;
        }

        const match = source.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (!match) return null;

        try {
            const thumbnail = await sharp(Buffer.from(match[1], "base64"))
                .rotate()
                .resize(GALLERY_THUMBNAIL_WIDTH, GALLERY_THUMBNAIL_HEIGHT, { fit: "cover" })
                .flatten({ background: "#ffffff" })
                .jpeg({ quality: 70 })
                .toBuffer();

            return `data:image/jpeg;base64,${thumbnail.toString("base64")}`;
        } catch {
            return null;
        }
    }));

    return images.filter((image): image is string => Boolean(image));
}
