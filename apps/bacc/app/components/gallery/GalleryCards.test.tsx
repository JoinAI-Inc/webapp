import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("HistoryCard template title", () => {
    it("renders the template title at the mobile image edge and desktop card overlay edge", async () => {
        const { HistoryCard } = await import("./GalleryCards.js");
        const markup = renderToStaticMarkup(
            <HistoryCard
                item={{
                    id: "media-1",
                    url: "",
                    thumbnailUrl: null,
                    generationType: "template",
                    metadata: {
                        templateId: "template-1",
                        templateName: "A template title that should truncate",
                        gallerySubjects: [{
                            gender: "Feminine",
                            makeup: "Need",
                        }],
                    },
                    promptData: null,
                    createdAt: "2026-06-11T00:00:00.000Z",
                }}
                onPreview={() => undefined}
                onRecreate={() => undefined}
            />,
        );

        const mobileClasses = markup.match(/data-template-title="mobile"[^>]*class="([^"]*)"/)?.[1]?.split(" ") || [];
        assert.ok(["absolute", "bottom-[12px]", "truncate", "tablet:hidden"].every((name) => mobileClasses.includes(name)));

        const desktopClasses = markup.match(/data-template-title="desktop"[^>]*class="([^"]*)"/)?.[1]?.split(" ") || [];
        assert.ok([
            "absolute",
            "bottom-[12px]",
            "truncate",
            "hidden",
            "tablet:block",
            "tablet:group-hover:opacity-100",
        ].every((name) => desktopClasses.includes(name)));
        assert.match(markup, /data-template-title="mobile"[^>]*>A template title that should truncate<\/p>/);
        assert.match(markup, /data-template-title="desktop"[^>]*>A template title that should truncate<\/p>/);

        const recreateClasses = markup.match(/aria-label="Create another from this template"[^>]*class="([^"]*)"/)?.[1]?.split(" ") || [];
        assert.ok(recreateClasses.includes("tablet:group-hover:opacity-100"));
        assert.ok(!recreateClasses.includes("group-hover:opacity-100"));

        const hoverMaskClasses = markup.match(/data-card-hover-mask="true"[^>]*class="([^"]*)"/)?.[1]?.split(" ") || [];
        assert.ok(hoverMaskClasses.includes("tablet:group-hover:opacity-100"));
        assert.ok(!hoverMaskClasses.includes("group-hover:opacity-100"));
    });
});
