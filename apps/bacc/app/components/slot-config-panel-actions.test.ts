import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("SlotConfigPanel action layout", () => {
    it("uses one responsive action region for every mutually exclusive action", () => {
        const source = readFileSync(
            new URL("./SlotConfigPanel.tsx", import.meta.url),
            "utf8",
        );

        assert.equal(
            source.match(/data-slot-config-action-region/g)?.length,
            1,
        );
        assert.match(
            source,
            /const actionButtonClassName = "[^"]*h-\[40px\][^"]*w-full[^"]*tablet:w-auto[^"]*";/,
        );

        const actionRegion = source.match(
            /<div[\s\S]*?data-slot-config-action-region[\s\S]*?<\/div>\s*\{loading && !isBrewing/,
        )?.[0];

        assert.ok(actionRegion);
        assert.match(actionRegion, /One More/);
        assert.match(actionRegion, /Login to Generate/);
        assert.match(actionRegion, /"Generate"/);
    });
});
