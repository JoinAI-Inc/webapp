import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    extractSlotImages,
    formatGalleryDate,
    getGalleryCardUrl,
    getHistoryGalleryCardMeta,
    getPendingGalleryMeta,
    getPendingGalleryCardMeta,
    getResultUrl,
} from "./gallery.types.js";

describe("gallery image URLs", () => {
    const item = {
        id: "media-1",
        url: "https://example.com/generated.png",
        thumbnailUrl: "https://example.com/generated-thumb.jpg",
        generationType: "template",
        promptData: null,
        createdAt: "2026-06-10T00:00:00.000Z",
    };

    it("uses the thumbnail in the gallery grid", () => {
        assert.equal(getGalleryCardUrl(item), item.thumbnailUrl);
    });

    it("keeps the original image for preview and download", () => {
        assert.equal(getResultUrl(item), item.url);
    });
});

describe("gallery metadata", () => {
    it("formats completed card subject fields", () => {
        assert.deepEqual(getHistoryGalleryCardMeta({
            id: "media-subject",
            url: "https://example.com/generated.png",
            thumbnailUrl: null,
            generationType: "template",
            metadata: null,
            promptData: null,
            gallerySubjects: [{
                refId: "person-1",
                gender: "Masculine",
                makeup: "No need",
            }],
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Masculine",
            subtitle: "No Makeup Look",
        });
    });

    it("formats pending card subject fields", () => {
        assert.deepEqual(getPendingGalleryCardMeta({
            taskId: "task-subject",
            status: "processing",
            metadata: {
                type: "template",
                payload: {
                    slots: [{
                        refId: "person-1",
                        slotType: "PERSON",
                        imageSource: "data:image/png;base64,person",
                        gender: "Furbaby",
                        makeup: "Need",
                    }],
                },
                submittedAt: "2026-06-10T00:00:00.000Z",
            },
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Furbaby",
            subtitle: "Makeup Look",
        });
    });

    it("uses Data Error only when subject fields are missing", () => {
        assert.deepEqual(getHistoryGalleryCardMeta({
            id: "media-missing-subject",
            url: "https://example.com/generated.png",
            thumbnailUrl: null,
            generationType: "template",
            metadata: null,
            promptData: null,
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Data Error",
            subtitle: "Data Error",
        });
    });

    it("preserves non-empty unknown subject values", () => {
        assert.deepEqual(getHistoryGalleryCardMeta({
            id: "media-unknown-subject",
            url: "https://example.com/generated.png",
            thumbnailUrl: null,
            generationType: "template",
            metadata: null,
            promptData: null,
            gallerySubjects: [{
                refId: "person-1",
                gender: "Robot",
                makeup: "Optional",
            }],
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Robot",
            subtitle: "Optional",
        });
    });

    it("uses list-safe slot images when prompt data is omitted", () => {
        assert.deepEqual(extractSlotImages({
            id: "media-2",
            url: "https://example.com/generated.png",
            thumbnailUrl: null,
            generationType: "template",
            metadata: null,
            promptData: null,
            slotImages: [
                "https://example.com/person-thumb.jpg",
                "https://example.com/ootd.png",
            ],
            createdAt: "2026-06-10T00:00:00.000Z",
        }), [
            "https://example.com/person-thumb.jpg",
            "https://example.com/ootd.png",
        ]);
    });

    it("derives pending gallery labels from task payload metadata", () => {
        assert.deepEqual(getPendingGalleryMeta({
            taskId: "task-1",
            status: "processing",
            metadata: {
                type: "template",
                payload: {
                    templateName: "Editorial",
                    makeup: "Evening look",
                },
                submittedAt: "2026-06-10T00:00:00.000Z",
            },
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Editorial",
            subtitle: "Evening look",
        });
    });

    it("keeps current pending gallery fallback labels", () => {
        assert.deepEqual(getPendingGalleryMeta({
            taskId: "task-2",
            status: "pending",
            metadata: null,
            createdAt: "2026-06-10T00:00:00.000Z",
        }), {
            title: "Masculine",
            subtitle: "Makeup look",
        });
    });
});

describe("gallery dates", () => {
    it("returns an empty date for invalid input", () => {
        assert.equal(formatGalleryDate("not-a-date"), "");
    });

    it("keeps the existing US date format", () => {
        assert.match(formatGalleryDate("2026-06-10T12:00:00.000Z"), /^Jun 10, 2026$/);
    });
});
