import assert from "node:assert/strict";
import { it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

it("uses the shared generation preview visual for brewing cards", async () => {
    const { BrewingCard } = await import("./GalleryCards.js");
    const markup = renderToStaticMarkup(
        <BrewingCard
            task={{
                taskId: "task-1",
                status: "processing",
                metadata: {
                    type: "template",
                    payload: {},
                    submittedAt: "2026-06-11T00:00:00.000Z",
                },
                createdAt: "2026-06-11T00:00:00.000Z",
            }}
        />,
    );

    assert.match(markup, /class="[^"]*generation-preview-visual[^"]*"/);
    assert.doesNotMatch(markup, /alt="Generating\.\.\."/);
});
