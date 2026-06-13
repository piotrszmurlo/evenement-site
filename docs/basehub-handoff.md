# BaseHub CMS Handoff

## Objective

Replace the current mock investment data with BaseHub-backed content and assets while keeping the site static, easy to edit, and safe to run locally.

## Confirmed Decisions

- BaseHub is the source of truth for structured content and assets.
- Use one BaseHub environment only for v1.
- Local development should fetch live BaseHub content when credentials are available.
- Public pages should show all units, including available, reserved, and sold.
- Keep a local fixture only for tests and offline fallback, not as the primary dev source.

## Current Repo State

The current mock content is concentrated in:

- [`src/data/mock-investments.ts`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/data/mock-investments.ts)

The current route structure is already in place and should be preserved:

- [`src/pages/inwestycje/index.astro`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/pages/inwestycje/index.astro)
- [`src/pages/inwestycje/[investmentSlug]/index.astro`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/pages/inwestycje/[investmentSlug]/index.astro)
- [`src/pages/inwestycje/[investmentSlug]/[unitSlug]/index.astro`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/pages/inwestycje/[investmentSlug]/[unitSlug]/index.astro)

There is also existing client copy in:

- [`src/data/client.ts`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/data/client.ts)

And the current Astro content config is still a stub:

- [`src/content.config.ts`](/C:/Users/weron/Documents/dev/evenement/evenement-app/src/content.config.ts)

Use the CMS data model note as the canonical content design reference:

- [`docs/cms-data-model.md`](/C:/Users/weron/Documents/dev/evenement/evenement-app/docs/cms-data-model.md)

## What Needs To Be Built

### 1. BaseHub schema

Create content models for:

- developer
- investment
- unit
- price history entry

Include asset fields for:

- logo
- hero image
- gallery images
- unit main image
- prospectus PDF

Recommended relationships:

- one developer can own multiple investments
- one investment can contain multiple units
- one unit can contain multiple price history entries

### 2. Content access layer

Add a shared CMS loader in the app, for example:

- `src/lib/basehub.ts`
- or `src/lib/content.ts`

That layer should:

- fetch from BaseHub
- normalize BaseHub records into the app's current shapes
- expose a single data source for pages
- support local dev, build, and test usage

### 3. Page migration

Replace all direct mock-data imports with the CMS loader.

Update pages so they:

- render the investment list from BaseHub
- render investment detail pages from BaseHub
- render unit detail pages from BaseHub
- continue showing reserved and sold units

### 4. Local dev behavior

Local dev should work in this order:

1. Fetch live BaseHub data when env vars are present.
2. Fall back to fixture data if needed for tests or offline runs.

Do not make the fixture the default path unless BaseHub is unavailable.

### 5. Assets

Since BaseHub will store assets too, decide how the app consumes them:

- direct asset URLs from BaseHub
- or BaseHub asset references resolved in the loader

The loader should hide that detail from the page components.

### 6. Validation and safety

Add checks for required fields before rendering or exporting:

- slugs
- required contact fields
- prospectus URL/file
- unit pricing history
- image presence where required

Fail early with clear errors if BaseHub content is incomplete.

## Suggested Build Order

1. Define or confirm the BaseHub schema.
2. Add BaseHub environment variables and client setup.
3. Build the content loader and types.
4. Wire the three investment pages to the loader.
5. Add fixture fallback for tests and offline use.
6. Move assets to BaseHub and verify rendering.
7. Remove the old mock data file once unused.

## Notes For The Next Agent

- Treat the existing mock file as a migration map, not as the final architecture.
- Keep the public UI showing all units.
- Keep the implementation simple enough that BaseHub publish can be the only content editing workflow.
- Preserve the current route structure unless there is a strong reason to change it.

## Open Questions

- Which BaseHub query/client package should we use in this repo?
- Should the local fixture live in `fixtures/` or under `src/data/`?
- Do we want a small validation script for BaseHub content shape, or should validation live only in the loader?
