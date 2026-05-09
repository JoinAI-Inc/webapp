# Design System Document

## 1. Overview & Creative North Star: "The Festive Editorial"

This design system is engineered to elevate a functional photography app into a premium, celebratory experience. Our Creative North Star is **"The Festive Editorial."** We move away from the "app-as-a-utility" look and toward the "app-as-a-curated-gallery." 

By utilizing intentional white space, sophisticated tonal layering, and high-contrast typography, we create a digital environment that feels as tactile and premium as a high-end fashion magazine. The festive energy of the Chinese New Year—vibrant red, joy, and luck—is balanced by a modern, minimalist framework that ensures the user's photography remains the hero.

---

## 2. Colors: Vibrancy & Depth

Our palette is anchored by a high-energy "Lucky Red" but supported by a complex hierarchy of neutrals that provide the "breathing room" required for a premium feel.

### Color Tokens

*   **Primary:** `#bb0012` (Lucky Red) – Used for primary actions and brand identity.

*   **Primary Container:** `#e7161f` – Used for hover states and high-priority accents.

*   **Surface:** `#f9f9f9` – Our core canvas.

*   **Surface Container Low:** `#f3f3f3` – Subtle depth.

*   **Surface Container High:** `#e8e8e8` – Nested element background.

*   **On-Surface:** `#1a1c1c` – Deep charcoal for maximum readability.

### The "No-Line" Rule

To maintain an editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` image gallery sits on a `surface` background. The contrast in tone, not a line, creates the edge.

### The "Glass & Gradient" Rule

Floating elements (modals, top navigation on scroll) should utilize **Glassmorphism**. Use semi-transparent surface colors with a `backdrop-blur` (12px–20px). Main Call-to-Actions (CTAs) should feature a subtle linear gradient from `primary` to `primary_container` (top-to-bottom) to give buttons a "gem-like," high-end finish.

---

## 3. Typography: The Editorial Scale

We use a dual-font strategy to balance character with clarity. **Plus Jakarta Sans** provides a modern, geometric personality for high-impact moments, while **Inter** ensures rock-solid legibility for functional content.

| Level | Font Family | Size | Use Case |

| :--- | :--- | :--- | :--- |

| **Display-LG** | Plus Jakarta Sans | 3.5rem | Hero moments / Special announcements |

| **Headline-SM** | Plus Jakarta Sans | 1.5rem | Section titles (e.g., "Ideas for You") |

| **Title-LG** | Inter | 1.375rem | Modal headers, card titles |

| **Body-MD** | Inter | 0.875rem | Primary body text, descriptions |

| **Label-MD** | Inter | 0.75rem | Navigation items, small captions |

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows often look "cheap." We achieve hierarchy through physical layering principles.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A card using `surface_container_lowest` (pure white) should be placed on a background of `surface_container_low` to create a soft, natural lift.

*   **Ambient Shadows:** If a floating effect is required (e.g., the User Profile dropdown), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(26, 28, 28, 0.06);`. The shadow color must be a tint of the `on_surface` color, never pure black.

*   **The "Ghost Border" Fallback:** If a border is required for accessibility on interactive cards, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are forbidden.

---

## 5. Components

### Navigation Bar

*   **Style:** Fixed at the top, utilizing a "Glass" background (Surface with 80% opacity and 20px blur).

*   **Items:** (Idea, Gallery, Visit Website, Top Up). Use `label-md` for text.

*   **User Avatar:** Always circular with a 2px `surface` gap if overlapping.

### Buttons

*   **Primary Button:** `primary` to `primary_container` gradient, `rounded-full` (pill shape), white text, bold weight.

*   **Secondary/Selection Chips:** `surface_container_highest` background, `on_surface` text. When selected, switch to `primary` background with `on_primary` text.

*   **Hover States:** Buttons should lift slightly (scale 1.02) and deepen in color; they should not grow a heavy shadow.

### Cards & Photo Feeds

*   **Geometry:** Use `lg` (1rem) or `xl` (1.5rem) corner radii to echo the "festive/friendly" theme.

*   **Spacing:** Forbid divider lines. Use `spacing-lg` (1.5rem) of vertical white space to separate feed items.

*   **Image Handling:** Photos are the star. Use `object-cover` and ensure the `surface_container_highest` acts as a placeholder color during loading.

### Input Fields & Controls

*   **Style:** Minimalist. No heavy boxes. Use `surface_container_low` as the background with a `rounded-md` (0.75rem) corner.

*   **Checkboxes/Radios:** Use `primary` for active states. Avoid "default" browser styling; use custom-drawn shapes that match the system's roundedness scale.

---

## 6. Do's and Don'ts

### Do

*   **Do** use asymmetrical grid layouts for photo galleries to create a "scrapbook" editorial feel.

*   **Do** lean into white space. If a layout feels crowded, remove a line and add 16px of padding.

*   **Do** use "Lucky Red" sparingly but intentionally—it should draw the eye to the most important action on the screen.

### Don't

*   **Don't** use 1px solid black or grey borders.

*   **Don't** use default Material Design shadows. Our depth is "Ambient," not "Direct."

*   **Don't** mix more than two font families. Stick to the Jakarta/Inter pairing to maintain visual authority.

*   **Don't** use sharp corners. Every element should feel approachable and celebratory through the use of the Roundedness Scale.