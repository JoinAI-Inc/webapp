# Gallery Card Subject Fields Design

## Goal

Replace the two template-title lines on Gallery cards with the selected protagonist gender and makeup-look state, while preserving the existing card layout.

## Data Contract

Each submitted `PERSON` slot carries:

- `gender`: the selected protagonist gender;
- `makeup`: the selected makeup-look option.

The current UI values are:

- gender: `Feminine`, `Masculine`, or `Furbaby`;
- makeup: `Need` or `No need`.

The API preserves these fields when normalizing slots and placing the generation task on the queue. The Worker stores them in `promptData.slots` and writes a lightweight `gallerySubjects` array into media metadata so the history list does not need to return the large prompt payload.

Each `gallerySubjects` entry contains `refId`, `gender`, and `makeup` for a `PERSON` slot. Gallery cards display the first entry because the current card has space for one pair of labels.

## Display Rules

The first text line displays gender:

- missing, `null`, or empty: `Data Error`;
- any non-empty value, including an unknown value: display it unchanged.

The second text line displays makeup:

- `Need`, case-insensitive: `Makeup Look`;
- `No need`, case-insensitive: `No Makeup Look`;
- missing, `null`, or empty: `Data Error`;
- any other non-empty value: display it unchanged.

Pending cards derive the same labels directly from the queued slot payload. Completed cards use `gallerySubjects` returned by the history API.

## Scope

- Preserve card dimensions, typography, spacing, truncation, date placement, images, and interactions.
- Do not infer values for old records.
- Old records without subject data display `Data Error` on both lines.
- Do not backfill gender or makeup values because the old records do not contain those selections.

## Testing

Add focused tests for:

- PERSON slot submission includes default and selected gender/makeup values;
- API normalization preserves the fields;
- Worker metadata extracts only PERSON subject fields;
- history API returns `gallerySubjects`;
- Gallery label formatting maps known makeup values, preserves unknown values, and uses `Data Error` only for missing values.

Verify with Node tests, TypeScript checks, and the hot-reloading Gallery page. Do not run a production build.
