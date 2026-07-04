# BaseHub CMS Wiring Handoff

## Objective

Replace the current mock investment data with BaseHub-backed investment, unit, price, and asset content.

Keep the site static, preserve the current route structure, and keep the implementation intentionally simple.

## Final Product Decisions

- BaseHub owns investment/unit content and assets.
- Company/developer data stays in code for v1, primarily `src/data/client.ts`.
- Brand/site identity stays in `src/config/brand.ts`.
- Government/export-specific fields are postponed.
- Public pages show all published investments.
- `/inwestycje/` should show both active and ended investments; ended investments should be labeled.
- Public pages show all published units with statuses: available, reserved, sold.
- There is no CMS-level hidden/draft field. BaseHub publish controls visibility.
- Prospectus file is optional for all investments in v1.
- Descriptions are plain text, not rich text.
- Galleries support multiple images.
- Current price means the latest price history row by `validFrom`, with no future-date filtering.
- Unit detail pages display full price history.
- Investment detail unit tables show only the latest/current price.

## Current Repo State

Mock investment content is still in:

- `src/data/mock-investments.ts`

Mock data is currently imported by:

- `src/pages/index.astro`
- `src/pages/inwestycje/index.astro`
- `src/pages/inwestycje/[investmentSlug]/index.astro`
- `src/pages/inwestycje/[investmentSlug]/[unitSlug]/index.astro`

Preserve the current public route structure:

- `/inwestycje/`
- `/inwestycje/{investmentSlug}/`
- `/inwestycje/{investmentSlug}/{unitSlug}/`

BaseHub is already installed:

- `basehub` dependency exists in `package.json`
- `basehub.config.ts` exists
- `basehub-types.d.ts` has been regenerated from the final schema

## Final BaseHub Schema

Root query:

```text
content
  investments
```

Investment item:

```text
name
slug
summary
description
locationAddress
gallery
  image
prospectusFile
salesStatus: active | ended
units
```

Unit item:

```text
unitNumber
slug
propertyType: dom jednorodzinny | dom w zabudowie szeregowej | lokal mieszkalny
status: available | reserved | sold
usableAreaM2
plotAreaM2
rooms
description
gallery
  image
priceHistory
```

Price history item:

```text
validFrom
totalPrice
```

## Generated Type Shape To Use

`basehub-types.d.ts` confirms galleries are list-backed:

```ts
investment.gallery.items.map((item) => item.image)
unit.gallery.items.map((item) => item.image)
```

Investment gallery type:

```ts
InvestmentsItem {
  gallery: Gallery_1
}

Gallery_1 {
  items: GalleryItem_1[]
}

GalleryItem_1 {
  image: BlockImage
}
```

Unit gallery type:

```ts
UnitsItem {
  gallery: Gallery
}

Gallery {
  items: GalleryItem[]
}

GalleryItem {
  image: BlockImage
}
```

Price history type:

```ts
PriceHistory {
  items: PriceHistoryItem[]
}

PriceHistoryItem {
  validFrom: string
  totalPrice: number
}
```

## Recommended App-Side Normalized Shape

The CMS shape should stay minimal, but the loader should derive ergonomic fields for pages:

```ts
investment.coverImage = investment.gallery[0]
unit.coverImage = unit.gallery[0]
unit.currentPrice = latest priceHistory entry by validFrom
priceEntry.pricePerM2 = priceEntry.totalPrice / unit.usableAreaM2
```

Pages should not know whether assets came from BaseHub media objects or a fixture.

## Content Loader

Create a shared loader, preferably:

```text
src/lib/content.ts
```

It should expose functions similar to:

```ts
getInvestments()
getInvestmentBySlug(slug)
getUnitBySlug(investmentSlug, unitSlug)
```

The loader should:

- query BaseHub when configured to do so
- normalize BaseHub records into one app-facing type
- support fixture fallback
- validate content before pages render
- collect all validation errors and throw once with a readable message

## Environment Behavior

Add:

```text
CONTENT_SOURCE=auto | basehub | fixture
```

Recommended behavior:

```text
local dev:
  auto = try BaseHub if credentials exist, fallback to fixture

tests:
  use fixture explicitly

production build:
  use BaseHub only, fail if unavailable or invalid
```

Existing BaseHub env examples are in `.env.example`.

## Fixture

Create:

```text
fixtures/sample-content.json
```

Fixture should mirror the simplified CMS shape exactly, not the normalized app shape.

Include:

- at least one active investment
- at least three units
- available, reserved, and sold examples
- at least one unit with two price history entries
- gallery arrays for every investment and unit

Derived fields like `coverImage`, `currentPrice`, and `pricePerM2` should never be stored in the fixture.

## Validation Rules

Use hand-written TypeScript validation for now.

Investment required fields:

- `name`
- `slug`
- `summary`
- `description`
- `locationAddress`
- `salesStatus` in `active | ended`
- at least one gallery image
- units array

Unit required fields:

- `unitNumber`
- `slug`
- `propertyType` in allowed values
- `status` in `available | reserved | sold`
- positive `usableAreaM2`
- positive `plotAreaM2`
- positive `rooms`
- `description`
- at least one gallery image
- at least one price history entry

Price history required fields:

- valid/date-like `validFrom`
- positive `totalPrice`

Also validate:

- investment slugs are unique
- unit slugs are unique within an investment

## Page Migration Notes

Replace all imports from `src/data/mock-investments.ts`.

Update:

- homepage investment highlight in `src/pages/index.astro`
- investment listing in `src/pages/inwestycje/index.astro`
- investment detail static paths and render data
- unit detail static paths and render data

Keep table/list behavior:

- investment table shows latest total price
- calculate latest price per m2 from `totalPrice / usableAreaM2`
- unit detail page shows full price history newest-first
- show prospectus link only when `prospectusFile` exists

## Suggested Build Order

1. Add app content types and fixture shape.
2. Add `src/lib/content.ts` with BaseHub query, fixture loading, normalization, and validation.
3. Wire homepage and investment pages to the loader.
4. Run `astro check` / build.
5. Remove `src/data/mock-investments.ts` only after no imports remain and the build passes.

## Important Non-Goals For This Pass

- Do not add developer/company CMS model.
- Do not add government export fields.
- Do not add price components.
- Do not add hidden/draft visibility fields.
- Do not add rich text rendering.
- Do not add Zod unless the implementation grows beyond the current simple validation needs.
