import assert from "node:assert/strict";
import { it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

it("uses a pointer cursor on the full-card preview button", async () => {
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
                    templateName: "Template",
                },
                promptData: null,
                createdAt: "2026-06-11T00:00:00.000Z",
            }}
            onPreview={() => undefined}
            onRecreate={() => undefined}
        />,
    );

    const previewClasses = markup
        .match(/aria-label="Preview Template"[^>]*class="([^"]*)"/)?.[1]
        ?.split(" ") || [];

    assert.ok(previewClasses.includes("cursor-pointer"));
});
