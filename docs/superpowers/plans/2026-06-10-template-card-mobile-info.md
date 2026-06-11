# Template Card Mobile Info Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show template name and favorite count below each preview image on screens narrower than 735px while preserving the existing desktop hover overlay.

**Architecture:** Keep one shared card link/click target. Split presentation into a mobile-only metadata row below the image and a tablet-and-up hover overlay inside the image.

**Tech Stack:** React, Next.js, Tailwind CSS, Node test runner

---

### Task 1: Add Mobile Metadata

**Files:**
- Modify: `apps/bacc/app/components/TemplateGallery.tsx`
- Test: `apps/bacc/app/components/template-card-navigation.test.ts`

- [x] Add a failing source-structure test requiring a `template-mobile-info` region with `tablet:hidden`.
- [x] Run `./node_modules/.bin/tsx --test apps/bacc/app/components/template-card-navigation.test.ts` and confirm it fails.
- [x] Add the mobile metadata row below the image and make the hover overlay `hidden tablet:flex`.
- [x] Run component tests and confirm they pass.
- [x] Run `npx tsc --noEmit -p apps/bacc/tsconfig.json`.
