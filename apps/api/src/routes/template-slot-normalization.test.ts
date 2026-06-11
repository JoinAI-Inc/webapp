import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeTemplateSlots } from "./template-slot-normalization.js";

describe("normalizeTemplateSlots", () => {
    it("preserves protagonist gender and makeup", () => {
        const result = normalizeTemplateSlots([
            {
                refId: "person-1",
                slotType: "PERSON",
                imageSource: "data:image/png;base64,person",
                gender: "Masculine",
                makeup: "No need",
            },
        ], {});

        assert.equal(result[0].gender, "Masculine");
        assert.equal(result[0].makeup, "No need");
    });
});
