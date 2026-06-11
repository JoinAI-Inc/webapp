import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(relativePath: string) {
    return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("studio skeleton layout contracts", () => {
    it("matches the generate and gallery page containers", () => {
        const skeletons = read("./Skeletons.tsx");
        const galleryLoading = read("../(studio)/gallery/loading.tsx");
        const galleryPage = read("../(studio)/gallery/page.tsx");

        assert.match(
            skeletons,
            /w-\[92vw\] px-0 tablet:px-\[24px\] tablet:w-\[100vw\][^"]*max-w-\[1600px\]/,
        );

        const pageContainer = galleryPage.match(
            /<div className="(w-\[92vw\][^"]*py-\[40px\])">/,
        )?.[1];
        const loadingContainer = galleryLoading.match(
            /<div className="(w-\[92vw\][^"]*py-\[40px\])">/,
        )?.[1];

        assert.ok(pageContainer);
        assert.equal(loadingContainer, pageContainer);
    });

    it("matches the template detail shell and responsive columns", () => {
        const skeletons = read("./Skeletons.tsx");

        assert.match(
            skeletons,
            /w-full max-w-\[1280px\] pt-\[24px\] tablet:pt-\[32px\] flex items-center flex-col/,
        );
        assert.match(
            skeletons,
            /grid-cols-1 desktop:grid-cols-\[calc\(40%-16px\)_60%\][^"]*tablet:w-\[92vw\][^"]*max-w-\[1280px\]/,
        );
        assert.doesNotMatch(skeletons, /grid-cols-\[506px_minmax\(0,758px\)\]/);
    });

    it("uses the same responsive counts as the real grids", () => {
        const skeletons = read("./Skeletons.tsx");

        assert.match(
            skeletons,
            /template-skeleton-grid/,
        );
        assert.match(
            skeletons,
            /grid-cols-2 gap-\[12px\] tablet:grid-cols-4 desktop:grid-cols-5 desktop-l:grid-cols-6/,
        );
    });
});

describe("page skeleton content contracts", () => {
    it("matches the current login page split and mobile collage", () => {
        const skeletons = read("./Skeletons.tsx");

        assert.match(skeletons, /h-\[100svh\][^"]*overflow-hidden/);
        assert.match(skeletons, /desktop:flex-row desktop:justify-between/);
        assert.match(skeletons, /className="(?=[^"]*w-\[146px\])(?=[^"]*h-\[32px\])[^"]*"/);
        assert.match(skeletons, /max-w-\[368px\]/);
        assert.match(skeletons, /Array\.from\(\{ length: 4 \}\)/);
        assert.match(skeletons, /h-\[60vh\][^"]*desktop:w-\[40vw\]/);
        assert.doesNotMatch(skeletons, /tablet:w-1\/2/);
    });

    it("matches the current history filter count", () => {
        const skeletons = read("./Skeletons.tsx");
        assert.match(skeletons, /\{\[64, 104\]\.map/);
    });
});

describe("landing skeleton layout contracts", () => {
    it("uses one shared route skeleton implementation for initial overlays", () => {
        assert.match(read("./HomeSkeleton.tsx"), /HomeRouteSkeleton/);
        assert.match(read("./AboutSkeleton.tsx"), /AboutRouteSkeleton/);
        assert.match(read("./PokeSkeleton.tsx"), /PokeRouteSkeleton/);
    });

    it("keeps about and poke content aligned below the navigation", () => {
        const routeSkeletons = read("./LandingRouteSkeletons.tsx");
        const about = read("../(landing)/styles/about-skeleton.css");
        const poke = read("../(landing)/styles/poke-skeleton.css");

        assert.match(about, /\.about-sk-hero[\s\S]*padding-top: 80px;/);
        assert.match(about, /@media \(max-width: 1068px\)[\s\S]*padding-top: 60px;/);
        assert.match(about, /@media \(max-width: 734px\)[\s\S]*padding-top: 40px;/);

        assert.match(poke, /\.poke-sk-hero[\s\S]*padding-top: 100px;/);
        assert.match(poke, /@media \(max-width: 1068px\)[\s\S]*padding-top: 80px;/);
        assert.match(poke, /@media \(max-width: 734px\)[\s\S]*padding-top: 60px;/);
        assert.match(poke, /\.poke-sk-panel[\s\S]*max-width: 760px;/);
        assert.match(routeSkeletons, /Array\.from\(\{ length: 3 \}\)/);
        assert.match(routeSkeletons, /poke-sk-line-title-mobile-continuation/);
        assert.match(poke, /\.poke-sk-line-title-mobile-continuation[\s\S]*display: block;/);
        assert.match(routeSkeletons, /Array\.from\(\{ length: 16 \}\)/);
        assert.match(routeSkeletons, /poke-sk-more/);
        assert.match(routeSkeletons, /poke-sk-meta/);
    });

    it("preserves the full home section heights and spacing", () => {
        const routeSkeletons = read("./LandingRouteSkeletons.tsx");
        const skeletonCss = read("../(landing)/styles/skeleton.css");

        assert.match(routeSkeletons, /home-sk-pet-collage/);
        assert.match(routeSkeletons, /home-sk-pet-mobile-grid/);
        assert.match(routeSkeletons, /home-sk-ootd-card/);
        assert.match(skeletonCss, /\.home-sk-pet[\s\S]*height: 760px;/);
        assert.match(skeletonCss, /\.home-sk-ootd-card[\s\S]*aspect-ratio: 464 \/ 546;/);
        assert.match(skeletonCss, /\.home-sk-card-block[\s\S]*background: transparent;/);
        assert.match(skeletonCss, /\.home-sk-split[\s\S]*padding: 0 0 80px;/);
    });
});
