# Gallery Card Responsive Title Design

## Goal

Restore the completed Gallery card template title without replacing the existing protagonist gender and makeup rows.

## Display Rules

- Below the `tablet` breakpoint (`735px`), show the template title inside the main generated image at its bottom edge.
- At and above `tablet`, hide the mobile title and show the template title only while hovering the existing full-card mask.
- Position the desktop title at the bottom edge of the full card mask.
- Both title variants occupy one line and truncate overflow with an ellipsis.
- Keep the existing gender, makeup, date, source thumbnails, preview action, and recreate action unchanged.

## Data Source

Use the existing template metadata resolved by `getGalleryMeta(item)`. Do not derive the template title from the subject fields.

## Implementation

Render two presentational title elements in `HistoryCard` and control them with Tailwind's `tablet` responsive classes. The desktop title sits above the hover mask but below the card's transparent preview button.

## Testing

Render `HistoryCard` to static markup and assert that both title variants use the template title, responsive visibility classes, absolute bottom positioning, and single-line truncation.
