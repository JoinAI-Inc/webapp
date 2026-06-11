# Gallery Cards Small-Scope Optimization Design

## Goal

Improve `apps/bacc/app/components/gallery/GalleryCards.tsx` without changing its current visual design.

The optimization covers:

- valid and predictable interactive semantics;
- keyboard accessibility for preview and recreate actions;
- accurate pending-task metadata;
- lower runtime overhead for the generating label;
- defensive date formatting;
- focused regression tests for extracted data logic.

## Constraints

- Preserve existing card dimensions, aspect ratios, colors, spacing, typography, image treatment, overlays, and hover transitions.
- Preserve the current public props of `BrewingCard` and `HistoryCard`.
- Preserve the existing thumbnail-first gallery image behavior.
- Work with the current uncommitted changes in `GalleryCards.tsx`, `gallery.types.ts`, and `MyGallery.tsx`; do not revert or rewrite unrelated changes.
- Do not refactor gallery fetching, pagination, polling, preview modal behavior, or routing.

## Component Structure

### History card interaction

Keep the outer `article` as the visual and semantic content container, but remove `role="button"`, `tabIndex`, and keyboard handlers from it.

Add a transparent, absolutely positioned button that covers the card and triggers preview. Keep the recreate button as a sibling with a higher stacking order. This produces two valid button controls without nesting one interactive element inside another.

The existing overlay remains pointer-transparent and visually unchanged. The preview button receives the current focus ring. The recreate button keeps its current hover visibility and also becomes visible when it receives keyboard focus.

### Generating label

Replace the component-local interval and React state with a CSS-only animation. The rendered label keeps the same dimensions, typography, color, and perceived three-dot progression.

The animation must respect `prefers-reduced-motion` by showing a stable label when reduced motion is requested.

### Pending-task metadata

Add a pure helper in `gallery.types.ts` that derives the same `{ title, subtitle }` shape used by completed cards from pending task metadata.

The helper checks known payload fields such as template name, gender, style, subject, title, makeup, and look. When fields are absent, it returns the current defaults:

- title: `Masculine`
- subtitle: `Makeup look`

`BrewingCard` uses this helper, so existing tasks with no descriptive metadata remain visually unchanged.

### Date formatting

Keep the existing `en-US` local-date output for valid values. Invalid or empty dates return an empty string instead of rendering `Invalid Date`.

No fixed time zone is introduced because that would change the date currently shown to users in some locales.

## Types

Narrow the metadata payload enough to describe the fields consumed by gallery helpers while retaining an index signature for API fields not owned by this component.

This change should reduce new `any` usage without attempting a full gallery API model rewrite.

## Testing

Extend `gallery.types.test.ts` before implementation to cover:

- pending metadata produces the expected title and subtitle;
- missing pending metadata preserves the current fallback labels;
- invalid dates return an empty string;
- valid dates retain the existing display format.

Component semantics and visual behavior will be verified with TypeScript checks and a browser pass against the hot-reloading development server because the project does not currently include a React component test harness.

## Acceptance Criteria

- The gallery looks unchanged at desktop and mobile widths.
- Clicking a history card still opens preview.
- Enter or Space on the preview control opens preview.
- The recreate control does not open preview and remains keyboard reachable.
- Keyboard focus on recreate makes the control visible.
- Generating labels do not create per-card JavaScript intervals.
- Pending cards use available task metadata and preserve existing fallback text.
- Invalid dates do not display `Invalid Date`.
- Existing gallery URL and polling tests continue to pass.
