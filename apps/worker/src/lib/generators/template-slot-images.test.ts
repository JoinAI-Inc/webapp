import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGallerySlotImages } from "./template-slot-images.js";

describe("createGallerySlotImages", () => {
    it("keeps remote assets and compresses uploaded data images", async () => {
        const uploadedSvg = `data:image/svg+xml;base64,${Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>',
        ).toString("base64")}`;

        const images = await createGallerySlotImages([
            {
                refId: "person",
                slotType: "PERSON",
                imageSource: uploadedSvg,
            },
            {
                refId: "ootd",
                slotType: "OOTD",
                imageSource: "https://example.com/ootd.png",
            },
        ]);

        assert.equal(images.length, 2);
        assert.match(images[0], /^data:image\/jpeg;base64,/);
        assert.notEqual(images[0], uploadedSvg);
        assert.equal(images[1], "https://example.com/ootd.png");
    });

    it("skips an invalid uploaded image without dropping valid assets", async () => {
        const images = await createGallerySlotImages([
            {
                refId: "person",
                slotType: "PERSON",
                imageSource: "data:image/png;base64,not-valid-base64",
            },
            {
                refId: "decoration",
                slotType: "DECORATION",
                imageSource: "https://example.com/decoration.png",
            },
        ]);

        assert.deepEqual(images, ["https://example.com/decoration.png"]);
    });
});
