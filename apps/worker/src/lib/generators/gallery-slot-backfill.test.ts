import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    getMissingGallerySlotSources,
    mergeGallerySlotImages,
} from "./gallery-slot-backfill.js";

describe("gallery slot backfill", () => {
    it("extracts sources from legacy prompt data", () => {
        assert.deepEqual(getMissingGallerySlotSources({
            metadata: { templateName: "Editorial" },
            promptData: {
                slots: [
                    { imageSource: "data:image/png;base64,person" },
                    { imageSource: "data:image/png;base64,ootd" },
                    { imageSource: "data:image/png;base64,decoration" },
                ],
            },
        }), [
            "data:image/png;base64,person",
            "data:image/png;base64,ootd",
            "data:image/png;base64,decoration",
        ]);
    });

    it("skips records that already have gallery slot images", () => {
        assert.deepEqual(getMissingGallerySlotSources({
            metadata: { slotImages: ["data:image/jpeg;base64,thumbnail"] },
            promptData: {
                slots: [{ imageSource: "data:image/png;base64,person" }],
            },
        }), []);
    });

    it("preserves existing metadata when adding slot images", () => {
        assert.deepEqual(mergeGallerySlotImages(
            { templateId: "template-1", templateName: "Editorial" },
            ["data:image/jpeg;base64,thumbnail"],
        ), {
            templateId: "template-1",
            templateName: "Editorial",
            slotImages: ["data:image/jpeg;base64,thumbnail"],
        });
    });
});
