# Implementation Plan

Build a low-cost static website for a non-technical Polish real-estate developer, with CMS editing and automated publication of daily price data for `dane.gov.pl`.

## Goal

The developer should be able to edit investments, houses/apartments, photos, statuses, and prices without touching code. The system should publish:

- a public marketing/compliance website,
- listing pages with price history,
- daily CSV price snapshots,
- a stable XML import feed,
- a matching MD5 file.

The preferred recurring cost is only the domain. BaseHub free tier and Cloudflare Pages free tier are acceptable for v1.

## Stack Decision

Use:

- Astro for the static site.
- A ready-made Astro/Tailwind real-estate or landing-page template with a permissive license.
- BaseHub as hosted CMS.
- Cloudflare Pages for hosting.
- GitHub Actions for daily snapshot generation and commit-back.
- A separate TypeScript export module for government CSV/XML/MD5 generation.

Avoid:

- A custom admin panel in v1.
- Decap CMS on Cloudflare Pages for v1, because it requires extra GitHub OAuth plumbing and is less friendly for a non-technical editor.
- Runtime database/storage unless future requirements force it.

## Planned Routes

Public routes:

```text
/
/inwestycje/
/inwestycje/{investment-slug}/
/inwestycje/{investment-slug}/{unit-slug}/
/kontakt/
```

Government-facing static files:

```text
/otwarte-dane/feed.xml
/otwarte-dane/feed.md5
/otwarte-dane/{investment-slug}/ceny-ofertowe-{developer-slug}-{investment-slug}-{YYYY-MM-DD}.csv
```

## V1 Scope

V1 should support one developer and one active investment in the UI, while keeping the data model capable of multiple investments later.

Must have:

- homepage,
- investment detail page,
- unit/listing cards,
- unit/listing detail page,
- price history display,
- company/contact/sales-office details,
- prospectus URL/file field,
- BaseHub content model,
- government export script,
- daily GitHub Actions workflow,
- XML XSD validation in tests or CI,
- local fixture for exporter tests.

Nice to have:

- search/filter by unit status, area, price, and rooms,
- image optimization,
- preview deploys,
- webhook-triggered rebuild on BaseHub publish.

Out of scope for v1:

- contact form,
- user accounts,
- online reservation/payment,
- complex CRM integrations,
- multi-language site unless the chosen template makes it trivial.

## Data Flow

BaseHub is the editable source of truth for current business data.

On BaseHub publish:

1. Trigger a Cloudflare Pages rebuild.
2. Public site updates quickly.
3. Do not create extra same-day government snapshots.

On daily GitHub Actions schedule:

1. Fetch current BaseHub content.
2. Generate today's CSV snapshot for each reportable investment.
3. Update `/otwarte-dane/feed.xml`.
4. Generate lowercase `/otwarte-dane/feed.md5` from the XML.
5. Validate XML against `goverment-docs/otwarte_dane_latest.xsd`.
6. Commit generated files back to the repo.
7. Cloudflare Pages deploys the new static files.

## Export Module

Create the export as a separate tested module, not inside Astro page rendering.

Suggested files:

```text
src/lib/government-export/
scripts/generate-government-feed.ts
fixtures/sample-content.json
```

The module should expose pure functions for:

- selecting prices valid on an export date,
- generating official CSV rows,
- generating XML datasets/resources,
- generating MD5,
- validating stable `extIdent` values,
- validating required reportable fields.

The script should be runnable locally and in CI.

## Testing Strategy

Use the local fixture to test the exporter without BaseHub credentials.

Recommended tests:

- CSV header exactly matches `goverment-docs/Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv`.
- Not-applicable values output as `X`.
- Current price is selected by latest `validFrom <= exportDate`.
- XML contains one dataset for the investment and one resource per daily CSV snapshot.
- XML uses stable `extIdent` values.
- XML validates against `goverment-docs/otwarte_dane_latest.xsd`.
- MD5 is lowercase and matches the generated XML.

If the selected test runner is not already set by the project, use Vitest for TypeScript unit tests.

## Implementation Phases

### Phase 1: Bootstrap

- Create Astro project.
- Add chosen template.
- Add BaseHub project and content model.
- Configure Cloudflare Pages deployment.
- Add basic routes and placeholder content.

### Phase 2: CMS Model

- Implement BaseHub content model from `docs/cms-data-model.md`.
- Add validation for launch-critical fields.
- Seed sample content.
- Wire Astro pages to BaseHub.
- Add image handling.

### Phase 3: Government Export

- Implement fixture-based exporter.
- Generate CSV/XML/MD5 locally.
- Validate against XSD.
- Add tests around official CSV and XML behavior.
- Output files under `/otwarte-dane/`.

### Phase 4: Automation

- Add scheduled GitHub Actions workflow.
- Add manual workflow dispatch.
- Add commit-back for generated files.
- Add BaseHub publish webhook to trigger Cloudflare rebuild.
- Verify public content types for XML/MD5 on Cloudflare.

### Phase 5: Launch

- Populate real developer data.
- Populate real investment and units.
- Add prospectus URL/file.
- Run checklist from `goverment-docs/checklist.csv`.
- Ask developer/lawyer to review legal content.
- Send XML/MD5 URLs and provider/editor details to `kontakt@dane.gov.pl`.

## Legal And Operational Assumptions

This plan is an implementation plan, not legal advice.

Known assumptions:

- Publishing price history publicly is required or at least the safest reading of the checklist.
- Daily CSV snapshots should be generated even when prices do not change.
- One active XML source should keep all active resources listed; removing resources from XML may remove them from the portal.
- `availability=local` is preferred so `dane.gov.pl` copies CSV resources.
- Around 900 daily resources, contact `kontakt@dane.gov.pl` for the preferred strategy before reaching the recommended 1000-resource threshold.

## Future Scaling

When the developer adds a second investment:

- add another `Investment` document in BaseHub,
- add another dataset inside the same XML source unless `dane.gov.pl` advises a separate source,
- generate one daily CSV per investment,
- keep end-of-sale notes dataset-specific.

If generated files become too large for Git, migrate snapshots to Cloudflare R2 or another static object store. Do not start there for v1; Git commit-back is simpler and auditable.
