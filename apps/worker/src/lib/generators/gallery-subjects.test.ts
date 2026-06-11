import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGallerySubjects } from "./gallery-subjects.js";

describe("createGallerySubjects", () => {
    it("extracts lightweight PERSON subject fields", () => {
        assert.deepEqual(createGallerySubjects([
            {
                refId: "person-1",
                slotType: "PERSON",
                imageSource: "data:image/png;base64,person",
                gender: "Furbaby",
                makeup: "Need",
            },
            {
                refId: "ootd-1",
                slotType: "OOTD",
                imageSource: "https://example.com/ootd.png",
            },
        ]), [
            {
                refId: "person-1",
                gender: "Furbaby",
                makeup: "Need",
            },
        ]);
    });

    it("uses JSON-safe nulls for missing subject fields", () => {
        assert.deepEqual(createGallerySubjects([
            {
                refId: "person-1",
                slotType: "PERSON",
                imageSource: "data:image/png;base64,person",
            },
        ]), [
            {
                refId: "person-1",
                gender: null,
                makeup: null,
            },
        ]);
    });
});
