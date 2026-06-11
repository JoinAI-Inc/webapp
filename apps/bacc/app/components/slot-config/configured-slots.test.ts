import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildConfiguredSlots } from "./configured-slots.js";

const slots = [
    {
        id: "person-slot",
        refId: "person-1",
        slotType: "PERSON" as const,
        label: "Person",
        description: null,
    },
    {
        id: "ootd-slot",
        refId: "ootd-1",
        slotType: "OOTD" as const,
        label: "Outfit",
        description: null,
    },
];

describe("buildConfiguredSlots", () => {
    it("includes selected gender and makeup on PERSON slots", () => {
        const result = buildConfiguredSlots({
            slots,
            uploads: {
                "person-slot": {
                    preview: "data:image/png;base64,person",
                    base64: "data:image/png;base64,person",
                },
            },
            selectedAssets: { "ootd-slot": "asset-1" },
            genders: { "person-slot": "Furbaby" },
            makeups: { "person-slot": "No need" },
        });

        assert.deepEqual(result, [
            {
                refId: "person-1",
                slotType: "PERSON",
                imageSource: "data:image/png;base64,person",
                gender: "Furbaby",
                makeup: "No need",
            },
            {
                refId: "ootd-1",
                slotType: "OOTD",
                assetId: "asset-1",
            },
        ]);
    });

    it("uses current UI defaults when selections were not changed", () => {
        const result = buildConfiguredSlots({
            slots: [slots[0]],
            uploads: {
                "person-slot": {
                    preview: "data:image/png;base64,person",
                    base64: "data:image/png;base64,person",
                },
            },
            selectedAssets: {},
            genders: {},
            makeups: {},
        });

        assert.equal(result[0].gender, "Feminine");
        assert.equal(result[0].makeup, "Need");
    });
});
