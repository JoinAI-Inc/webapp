import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("TemplateCard navigation structure", () => {
    it("keeps the favorite button outside the template detail link", () => {
        const source = readFileSync(
            new URL("./TemplateGallery.tsx", import.meta.url),
            "utf8",
        );

        assert.doesNotMatch(
            source,
            /return <Link href=\{`\/generate\/\$\{template\.id\}`\}>\{cardContent\}<\/Link>;/,
        );
    });

    it("shows template metadata below the image on mobile only", () => {
        const source = readFileSync(
            new URL("./TemplateGallery.tsx", import.meta.url),
            "utf8",
        );

        assert.match(
            source,
            /className="template-mobile-info[^"]*tablet:hidden[^"]*"/,
        );
        assert.match(
            source,
            /Stats and Info overlay[\s\S]*className="(?=[^"]*\bhidden\b)(?=[^"]*\btablet:flex\b)[^"]*"/,
        );
        assert.match(
            source,
            /className="template-mobile-favorite-count[^"]*\bleading-none\b[^"]*"/,
        );
        assert.match(
            source,
            /@media \(max-width: 734px\)[\s\S]*\.template-favorite-button[\s\S]*opacity: 1;[\s\S]*pointer-events: auto;/,
        );
        assert.match(
            source,
            /M8\.00001 14\.072C5\.57601 14\.072/,
        );
        assert.doesNotMatch(
            source,
            /template-mobile-favorite-count[\s\S]*?<Flame size=\{14\}/,
        );
    });
});
