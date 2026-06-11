# Gallery Card Subject Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist protagonist gender and makeup selections and display them in the two Gallery card text lines.

**Architecture:** Extract PERSON-slot submission construction and Gallery label formatting into pure helpers with Node tests. Preserve the fields through API normalization and Worker storage, expose lightweight `gallerySubjects` in history responses, and keep card rendering/layout unchanged.

**Tech Stack:** React 18, Next.js 14, TypeScript, Express, Worker queue, Prisma JSON metadata, Node test runner

---

### Task 1: Submit PERSON Selections

**Files:**
- Create: `apps/bacc/app/components/slot-config/configured-slots.ts`
- Create: `apps/bacc/app/components/slot-config/configured-slots.test.ts`
- Modify: `apps/bacc/app/components/SlotConfigPanel.tsx`

- [x] Write failing tests proving PERSON slots include selected values and use `Feminine`/`Need` defaults.
- [x] Run the focused test and verify failure because the helper is missing.
- [x] Implement `buildConfiguredSlots` and replace the inline construction in `SlotConfigPanel`.
- [x] Run the focused test and verify it passes.

### Task 2: Preserve Fields Through API and Worker

**Files:**
- Create: `apps/api/src/routes/template-slot-normalization.ts`
- Create: `apps/api/src/routes/template-slot-normalization.test.ts`
- Modify: `apps/api/src/routes/templates.ts`
- Create: `apps/worker/src/lib/generators/gallery-subjects.ts`
- Create: `apps/worker/src/lib/generators/gallery-subjects.test.ts`
- Modify: `apps/worker/src/lib/generators/template-generator.ts`

- [x] Write failing API tests for preserving `gender` and `makeup`.
- [x] Write failing Worker tests for extracting PERSON entries into `gallerySubjects`.
- [x] Implement API normalization and reuse it from the generate route.
- [x] Implement Worker subject extraction and save it in media metadata.
- [x] Run both focused test files and verify they pass.

### Task 3: Return and Format Gallery Labels

**Files:**
- Modify: `apps/api/src/routes/history-list.ts`
- Modify: `apps/api/src/routes/history-list.test.ts`
- Modify: `apps/bacc/app/components/gallery/gallery.types.ts`
- Modify: `apps/bacc/app/components/gallery/gallery.types.test.ts`
- Modify: `apps/bacc/app/components/gallery/GalleryCards.tsx`

- [x] Write failing history API tests for returning `gallerySubjects`.
- [x] Write failing frontend tests for pending/completed subject labels and display rules.
- [x] Return sanitized `gallerySubjects` from history list items.
- [x] Implement Gallery formatting:
  - missing/empty gender: `Data Error`;
  - non-empty gender: unchanged;
  - `Need`: `Makeup Look`;
  - `No need`: `No Makeup Look`;
  - missing/empty makeup: `Data Error`;
  - other non-empty makeup: unchanged.
- [x] Replace the card metadata helper usage while preserving layout classes.
- [x] Run focused tests and verify they pass.

### Task 4: Regression Verification

**Files:**
- Verify all files above.

- [x] Run all Gallery, API normalization, and Worker metadata tests.
- [x] Run TypeScript checks for BACC, API, and Worker.
- [x] Run `git diff --check`.
- [x] Verify pending and completed cards in the hot-reloading Gallery page with known, missing, and unknown values.
- [x] Do not run a production build.
