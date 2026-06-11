# Gallery Card Responsive Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a responsive, single-line template title on completed Gallery cards while retaining the subject metadata footer.

**Architecture:** Resolve the title through the existing gallery metadata helper. Render separate mobile and desktop title elements so CSS alone controls breakpoint and hover behavior.

**Tech Stack:** React, Next.js, Tailwind CSS, Node test runner

---

### Task 1: Responsive Template Title

**Files:**
- Modify: `apps/bacc/app/components/gallery/GalleryCards.tsx`
- Test: `apps/bacc/app/components/gallery/GalleryCards.test.tsx`

- [ ] **Step 1: Write the failing render test**

Render `HistoryCard` with `metadata.templateName` and assert two single-line, bottom-positioned title elements with complementary `tablet` visibility classes.

- [ ] **Step 2: Verify the test fails**

Run: `./node_modules/.bin/tsx --test apps/bacc/app/components/gallery/GalleryCards.test.tsx`

Expected: FAIL because the card does not currently render template title elements.

- [ ] **Step 3: Implement the responsive titles**

Import `getGalleryMeta`, resolve `templateMeta`, render a mobile title inside the image wrapper, and render a desktop title above the existing full-card hover mask.

- [ ] **Step 4: Verify tests and types**

Run:

```bash
./node_modules/.bin/tsx --test apps/bacc/app/components/gallery/GalleryCards.test.tsx apps/bacc/app/components/gallery/gallery.types.test.ts
./node_modules/.bin/tsc --noEmit -p apps/bacc/tsconfig.json
```

Expected: all tests pass and TypeScript reports no errors.
