import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HISTORY_LIST_SELECT, toHistoryListItem } from "./history-list.js";

describe("history list response", () => {
    it("does not select or return promptData with inline base64 images", () => {
        assert.equal("promptData" in HISTORY_LIST_SELECT, false);

        const item = toHistoryListItem({
            id: "media-1",
            fileName: "generated.png",
            fileType: "image",
            storageUrl: "https://example.com/generated.png",
            thumbnailUrl: "https://example.com/generated-thumb.jpg",
            generationType: "template",
            metadata: {
                templateId: "template-1",
                templateName: "Lucky Portrait",
                slotImages: [
                    "data:image/jpeg;base64,compact-thumbnail",
                    "https://example.com/ootd.png",
                ],
                gallerySubjects: [
                    {
                        refId: "person-1",
                        gender: "Masculine",
                        makeup: "No need",
                    },
                ],
            },
            templateId: "template-1",
            createdAt: new Date("2026-06-10T00:00:00.000Z"),
        });

        assert.equal("promptData" in item, false);
        assert.equal(item.metadata.templateName, "Lucky Portrait");
        assert.deepEqual(item.slotImages, [
            "data:image/jpeg;base64,compact-thumbnail",
            "https://example.com/ootd.png",
        ]);
        assert.deepEqual(item.gallerySubjects, [
            {
                refId: "person-1",
                gender: "Masculine",
                makeup: "No need",
            },
        ]);
    });
});
