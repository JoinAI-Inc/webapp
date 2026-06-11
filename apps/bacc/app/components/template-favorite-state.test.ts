import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFavoriteState } from "./template-favorite-state.js";

describe("resolveFavoriteState", () => {
    it("increments the count when a template becomes favorited", () => {
        assert.deepEqual(
            resolveFavoriteState(
                { isFavorited: false, favoriteCount: 4 },
                true,
            ),
            { isFavorited: true, favoriteCount: 5 },
        );
    });

    it("decrements the count when a template becomes unfavorited", () => {
        assert.deepEqual(
            resolveFavoriteState(
                { isFavorited: true, favoriteCount: 4 },
                false,
            ),
            { isFavorited: false, favoriteCount: 3 },
        );
    });

    it("does not drift when the server repeats the current state", () => {
        assert.deepEqual(
            resolveFavoriteState(
                { isFavorited: true, favoriteCount: 4 },
                true,
            ),
            { isFavorited: true, favoriteCount: 4 },
        );
    });
});
