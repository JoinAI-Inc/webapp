# Gallery Cards Small-Scope Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve GalleryCards interaction semantics, pending metadata accuracy, date safety, and generating-label efficiency without changing the current visual design.

**Architecture:** Keep card rendering in `GalleryCards.tsx` and move reusable data normalization into pure helpers in `gallery.types.ts`. Cover the pure behavior with the existing Node test setup, then verify component structure through TypeScript and the hot-reloading development page.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 4, Node test runner

---

### Task 1: Pending Metadata and Safe Dates

**Files:**
- Modify: `apps/bacc/app/components/gallery/gallery.types.test.ts`
- Modify: `apps/bacc/app/components/gallery/gallery.types.ts`

- [x] **Step 1: Write failing helper tests**

Add tests that import `formatGalleryDate` and `getPendingGalleryMeta`, then assert:

```ts
it("derives pending gallery labels from task payload metadata", () => {
    assert.deepEqual(getPendingGalleryMeta({
        taskId: "task-1",
        status: "processing",
        metadata: {
            type: "template",
            payload: {
                templateName: "Editorial",
                makeup: "Evening look",
            },
            submittedAt: "2026-06-10T00:00:00.000Z",
        },
        createdAt: "2026-06-10T00:00:00.000Z",
    }), {
        title: "Editorial",
        subtitle: "Evening look",
    });
});

it("keeps current pending gallery fallback labels", () => {
    assert.deepEqual(getPendingGalleryMeta({
        taskId: "task-2",
        status: "pending",
        metadata: null,
        createdAt: "2026-06-10T00:00:00.000Z",
    }), {
        title: "Masculine",
        subtitle: "Makeup look",
    });
});

it("returns an empty date for invalid input", () => {
    assert.equal(formatGalleryDate("not-a-date"), "");
});

it("keeps the existing US date format", () => {
    assert.match(formatGalleryDate("2026-06-10T12:00:00.000Z"), /^Jun 10, 2026$/);
});
```

- [x] **Step 2: Run tests and confirm the expected failure**

Run:

```bash
./node_modules/.bin/tsx --test apps/bacc/app/components/gallery/gallery.types.test.ts
```

Expected: failure because `getPendingGalleryMeta` is not exported.

- [x] **Step 3: Implement typed metadata normalization**

In `gallery.types.ts`, introduce a payload type with the known gallery label fields and an index signature. Add a shared private metadata-normalization function, reuse it from `getGalleryMeta`, and export:

```ts
export function getPendingGalleryMeta(task: PendingTask) {
    return getMeta(task.metadata?.payload);
}
```

Update `formatGalleryDate` to return `""` when `new Date(date).getTime()` is not finite, while preserving the existing `toLocaleDateString("en-US", ...)` options.

- [x] **Step 4: Run tests and confirm they pass**

Run:

```bash
./node_modules/.bin/tsx --test apps/bacc/app/components/gallery/gallery.types.test.ts
```

Expected: all gallery type tests pass.

### Task 2: History Card Semantics and CSS Generating Label

**Files:**
- Modify: `apps/bacc/app/components/gallery/GalleryCards.tsx`
- Modify: `apps/bacc/app/styles/utilities.css`

- [x] **Step 1: Replace pending-card hard-coded labels**

Import `getPendingGalleryMeta`, derive `const meta = getPendingGalleryMeta(task)`, and pass `meta.title` and `meta.subtitle` to `GalleryText`.

- [x] **Step 2: Replace the React interval with CSS animation**

Remove `useEffect`, `useState`, and `GeneratingLabel`. Render the label as:

```tsx
<span className="gallery-generating-label j-t4 text-white">
    Generating<span aria-hidden="true" className="gallery-generating-dots" />
</span>
```

Add scoped utilities CSS that animates the dots using a fixed-width pseudo-element or clipped text, and disable animation under `prefers-reduced-motion`.

- [x] **Step 3: Separate preview and recreate controls**

Keep the outer `article` non-interactive. Add an absolutely positioned preview button spanning the card:

```tsx
<button
    type="button"
    aria-label={`Preview ${meta.title}`}
    onClick={() => onPreview(item)}
    className="absolute inset-0 z-10 rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F80ED]"
/>
```

Keep the recreate button at `z-20`, preserve its click handler, and add `focus-visible:opacity-100`. Preserve the existing pointer-transparent overlay and all visual classes.

- [x] **Step 4: Run TypeScript checking**

Run:

```bash
./node_modules/.bin/tsc --noEmit -p apps/bacc/tsconfig.json
```

Expected: exit code 0.

### Task 3: Regression and Hot-Reload Verification

**Files:**
- Verify: `apps/bacc/app/components/gallery/GalleryCards.tsx`
- Verify: `apps/bacc/app/components/gallery/gallery.types.ts`
- Verify: `apps/bacc/app/components/gallery/gallery.types.test.ts`

- [x] **Step 1: Run gallery regression tests**

Run:

```bash
./node_modules/.bin/tsx --test apps/bacc/app/components/gallery/gallery.types.test.ts apps/bacc/app/components/gallery/gallery-task-polling.test.ts
```

Expected: all tests pass.

- [x] **Step 2: Check formatting and accidental changes**

Run:

```bash
git diff --check
git diff -- apps/bacc/app/components/gallery/GalleryCards.tsx apps/bacc/app/components/gallery/gallery.types.ts apps/bacc/app/components/gallery/gallery.types.test.ts apps/bacc/app/styles/utilities.css
```

Expected: no whitespace errors and only scoped GalleryCards changes plus pre-existing edits.

- [x] **Step 3: Verify in the hot-reloading app**

Use the existing development server on port 3003 when available. Open the gallery in the in-app browser and check desktop and mobile widths:

- card dimensions, spacing, typography, image treatment, and overlay remain unchanged;
- clicking the card opens preview;
- keyboard focus reaches preview and recreate controls;
- recreate focus makes the icon visible;
- pending cards display metadata or current fallback text.

Do not run a production build.
