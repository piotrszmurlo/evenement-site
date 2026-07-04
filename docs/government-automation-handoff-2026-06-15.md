# Government Automation Handoff - 2026-06-15

This document summarizes the current conversation and implementation state so a fresh agent can continue without re-deriving context.

## Goal

Implement the first government-automation step:

1. identify the government-required CMS properties,
2. add them to BaseHub,
3. make sure the site/query layer still works,
4. leave XML/export implementation for later.

The user also clarified one implementation detail:

- `pricePerM2` must no longer be calculated in code
- it must be stored in CMS and read directly from BaseHub

## User Decisions Locked In

- Ground required fields in the government materials already in the repo.
- Do not over-require fields like `fax`, `krsNumber`, `ceidgNumber` unless the repo docs clearly support that.
- KISS validation:
  - model fields that appear in the canonical government CSV,
  - only validate fields we are 100% sure about from current materials,
  - do not infer legal-form-specific validation rules yet.
- `pricePerM2` must be a CMS field, not a derived field.

## Relevant Repo Sources

Use these first:

- [docs/government-data-feed.md](/home/pszmurlo/dev/evenement-site/docs/government-data-feed.md)
- [docs/cms-data-model.md](/home/pszmurlo/dev/evenement-site/docs/cms-data-model.md)
- [goverment-docs/how-to-automate.txt](/home/pszmurlo/dev/evenement-site/goverment-docs/how-to-automate.txt)
- [goverment-docs/Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv](/home/pszmurlo/dev/evenement-site/goverment-docs/Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv)

Key grounding already established:

- the FAQ points to the canonical CSV/model data file as the technical reference for scope
- the canonical CSV contains developer/company columns like `Forma prawna`, `KRS`, `CEIDG`, `NIP`, `REGON`, `fax`
- those fields should exist in CMS/export mapping
- but they should remain optional for now unless stronger source text is found

## Current BaseHub State

Branch in BaseHub MCP:

- `main`

Original schema before this work:

- top-level `content`
- `investments`
- nested `units`
- nested `priceHistory`
- no developer entity
- no government-reporting fields beyond public-site content

### Changes Successfully Applied In BaseHub

A top-level `developer` component was created under `content`.

It now exists in the BaseHub structure and has API names assigned:

- `developer`
- `name`
- `phone`
- `email`
- `websiteUrl`
- `buyerContactMethod`
- `additionalSalesLocations`
- `legalForm`
- `krsNumber`
- `ceidgNumber`
- `nip`
- `regon`
- `fax`
- nested `registeredAddress`
- nested `salesOfficeAddress`

Nested address API names were also assigned:

- `voivodeship`
- `county`
- `municipality`
- `city`
- `street`
- `buildingNumber`
- `unitNumber`
- `postalCode`

### BaseHub Structure Problem

The remaining required schema changes did **not** land:

- extending `priceHistory` with `pricePerM2`, `baseTotalPrice`, `totalPriceWithComponents`, `vatIncluded`, `note`, `correctionOfPreviousEntry`
- extending `investment` with `prospectusUrl`, dataset fields, investment address, etc.
- extending `unit` with `floor`, `governmentReportingEnabled`, and other government fields

Reason:

- `mcp__basehub_mcp.create_blocks` and `update_blocks` worked for top-level creation and renaming
- but failed with generic `Mutation failed: Unknown error.` when trying to extend the existing nested list component templates
- the higher-level MCP abstraction was not giving actionable error details for those nested schema edits

## Important Investigation Already Done

### MCP behavior

- `create_blocks` can create a top-level component under `content`
- `update_blocks` can assign API names/titles to created blocks
- nested schema extension inside existing component/list templates is the failing area

### BaseHub SDK / direct transaction path

This was investigated locally:

- `basehub-types.d.ts` exposes `mutation.transaction`
- local SDK types confirm raw mutation support via `Transaction`
- installed helper types are in:
  - `node_modules/.pnpm/@basehub+mutation-api-helpers@2.1.7_zod@4.4.3/node_modules/@basehub/mutation-api-helpers/dist/transaction.d.ts`

Important finding:

- the direct BaseHub API path can provide real errors and should allow more precise nested schema mutation than the MCP wrapper

### Token scope finding

Current local `.env` contains a **read** token:

- [\.env](/home/pszmurlo/dev/evenement-site/.env)

Direct mutation probe with that token failed with:

- `"This operation is not allowed in 'read' scope. Are you using the Admin Token? That one should give you 'write' scope."`

BaseHub MCP returned a **write** token via `get_token({ type: "write" })`, but the safety layer blocked direct shell usage of that token in command arguments.

## Current Code State

No code changes were made yet to the site/query layer.

The main file that needs follow-up once the schema exists is:

- [src/lib/content.ts](/home/pszmurlo/dev/evenement-site/src/lib/content.ts)

Current behavior there:

- `pricePerM2` is still derived from `totalPrice / usableAreaM2`
- this must be removed once `pricePerM2` exists in BaseHub `priceHistory`

Specific lines/behavior to change:

- extend the BaseHub query to read stored `pricePerM2`
- stop calculating `pricePerM2`
- validate stored `pricePerM2` as a positive number

Public pages that read `currentPrice.pricePerM2` already exist and can keep using that property once the loader stops deriving it:

- [src/pages/inwestycje/[investmentSlug]/index.astro](/home/pszmurlo/dev/evenement-site/src/pages/inwestycje/%5BinvestmentSlug%5D/index.astro)
- [src/pages/inwestycje/[investmentSlug]/[unitSlug]/index.astro](/home/pszmurlo/dev/evenement-site/src/pages/inwestycje/%5BinvestmentSlug%5D/%5BunitSlug%5D/index.astro)

## Narrow Validation Policy Agreed With User

For the first pass, validate only fields that are clearly grounded in current materials.

Safe required set:

- developer:
  - `name`
  - `phone`
  - `email`
  - structured registered address
  - structured sales office address
- investment:
  - structured address
  - `prospectusUrl`
- unit:
  - `unitNumber`
  - `propertyType`
  - `status`
  - `usableAreaM2`
  - at least one price entry for reportable units
- price entry:
  - `validFrom`
  - `pricePerM2`
  - `baseTotalPrice`
  - `vatIncluded`

Keep optional for now:

- `fax`
- `krsNumber`
- `ceidgNumber`
- `legalForm`
- `nip`
- `regon`
- government dataset identifiers

## Exact Blocker

The work is blocked on **writing nested BaseHub schema changes** to the existing `investment`, `unit`, and `priceHistory` templates.

The next agent should not spend more time trying random MCP wrapper shapes. That path was already explored enough to show it is unreliable here.

## Additional Investigation After Write Token Was Added

The local environment now has a working write-scoped `BASEHUB_TOKEN`.

A reusable local helper was added:

- [scripts/basehub-transaction.mjs](/home/pszmurlo/dev/evenement-site/scripts/basehub-transaction.mjs)

What it confirms:

- direct BaseHub mutation requests are reaching the API successfully
- the token scope is correct for write attempts
- failures are happening inside BaseHub transaction execution, not in local auth/network setup

### Nested Mutation Shapes Tried Directly

All of the following returned `TransactionStatus.status = "Failed"` with no useful message:

1. create a child `number` block under `WpisCenyComponent` (`aOsq5S6D3mS1ENXnYz5o6`)
   - with `isRequired: true`
   - with explicit `value`
   - with the field optional
2. update the `priceHistory` list/template shape through the list block (`XOfwN2CMY3RnO5N7t6YQt`)
3. update the full `WpisCenyComponent` schema by replacing `component.value` with existing fields plus `pricePerM2`

So the blocker is no longer “MCP wrapper might be wrong”.
It is now:

- either BaseHub rejects nested schema evolution for these existing templates,
- or it requires a still-undiscovered repository-specific mutation shape that is not evident from local SDK types/docs.

### Important Content-State Finding

This repository is **not empty** in BaseHub draft content:

- `investments.totalCount = 4`
- at least one investment has:
  - `units.totalCount = 1`
  - that unit has `priceHistory.totalCount = 1`

This means nested schema updates may be colliding with existing live instances, migrations, or template constraints.

### Practical Conclusion

The remaining schema work likely needs one of these:

1. manual schema edits in BaseHub UI for the nested templates, then continue code changes locally
2. BaseHub support / clearer mutation examples for evolving existing list templates with content already present
3. a deliberate migration strategy that duplicates/replaces templates instead of mutating them in place, if BaseHub supports that path

## Successful Restart On `test` Branch

After the user created a fresh BaseHub branch named `test` and removed the investment schema/content, the nested-schema blocker disappeared.

Current confirmed state on BaseHub branch:

- branch: `test`
- the schema was rebuilt successfully from scratch
- nested collections/components now work when there is no pre-existing populated template to migrate

### Rebuilt Schema Present On `test`

Top level:

- `content`
- `developer`
- `investments`

`developer` includes:

- `name`
- `phone`
- `email`
- `websiteUrl`
- `buyerContactMethod`
- `additionalSalesLocations`
- `legalForm`
- `krsNumber`
- `ceidgNumber`
- `nip`
- `regon`
- `fax`
- `registeredAddress`
- `salesOfficeAddress`

`investments` item includes:

- `name`
- `slug`
- `summary`
- `description`
- `locationAddress`
- `prospectusUrl`
- `prospectusFile`
- `salesStatus`
- `salesEndedAt`
- `salesEndedNote`
- `governmentDatasetExtIdent`
- `governmentDatasetTitle`
- `governmentDatasetDescription`
- `isReportedToGovernment`
- `investmentAddress`
- `gallery`
- `units`

`units` item includes:

- `unitNumber`
- `slug`
- `propertyType`
- `status`
- `usableAreaM2`
- `plotAreaM2`
- `rooms`
- `floor`
- `description`
- `governmentReportingEnabled`
- `includedInPriceNotes`
- `priceHistory`
- `gallery`

`priceHistory` item includes:

- `validFrom`
- `pricePerM2`
- `baseTotalPrice`
- `totalPriceWithComponents`
- `vatIncluded`
- `note`
- `correctionOfPreviousEntry`

### Local Code Changes Made After Rebuild

- [src/lib/content.ts](/home/pszmurlo/dev/evenement-site/src/lib/content.ts)
  - now reads stored `pricePerM2`
  - now reads `baseTotalPrice`
  - no longer derives `pricePerM2`
  - maps `totalPrice` from `baseTotalPrice` for public-site compatibility
  - supports `BASEHUB_REF`
- [basehub-types.d.ts](/home/pszmurlo/dev/evenement-site/basehub-types.d.ts)
  - regenerated from BaseHub branch `test`
- [\.env.example](/home/pszmurlo/dev/evenement-site/.env.example)
  - now documents `BASEHUB_REF`

### Important Operational Note

To make the local site query this rebuilt schema, the environment should point at the same BaseHub branch, for example:

- `BASEHUB_REF="test"`

## Recommended Next Move

Use the direct BaseHub mutation API with a write-scoped token, but do it in a way that does not expose the token in shell arguments.

Practical options:

1. get a write token again via `mcp__basehub_mcp.get_token({ type: "write" })`
2. use a safer execution pattern approved by the safety layer, for example:
   - temporarily write a local script that reads token from stdin or environment loaded at runtime
   - or use another approved method that avoids embedding the token in the command line
3. submit one small direct transaction first:
   - add `pricePerM2` to `WpisCenyComponent` (`aOsq5S6D3mS1ENXnYz5o6`)
4. once that works, finish the rest of the nested schema fields in the same direct API style
5. then update `src/lib/content.ts`

## Suggested Direct Mutation Targets

BaseHub IDs already identified:

- `content` document: `c60065cc731b4088c2ba8`
- investment component: `IcIVCaQoPSzUJajSIZF1g`
- unit component: `k77ieRDIntm8YtpEHpPjX`
- price history entry component: `aOsq5S6D3mS1ENXnYz5o6`

Top priority nested additions:

### Price history component

- `pricePerM2`
- `baseTotalPrice`
- `totalPriceWithComponents`
- `vatIncluded`
- `note`
- `correctionOfPreviousEntry`

### Investment component

- `prospectusUrl`
- `salesEndedAt`
- `salesEndedNote`
- `governmentDatasetExtIdent`
- `governmentDatasetTitle`
- `governmentDatasetDescription`
- `isReportedToGovernment`
- `investmentAddress` with structured fields

### Unit component

- `floor`
- `governmentReportingEnabled`
- `includedInPriceNotes`
- later the repeatable government lists:
  - `propertyParts`
  - `appurtenantRooms`
  - `useRights`
  - `otherFees`

If needed, defer the repeatable lists until after the basic scalar fields and `pricePerM2` are working.

## Suggested Code Changes After Schema Is Fixed

Update [src/lib/content.ts](/home/pszmurlo/dev/evenement-site/src/lib/content.ts):

- expand CMS interfaces for developer/investment/unit/price history
- extend `SITE_CONTENT_QUERY`
- map the new fields from BaseHub response
- remove `pricePerM2` derivation
- validate `pricePerM2` from content instead
- keep new government fields optional unless they are in the agreed narrow required set

Also regenerate:

- `basehub-types.d.ts`

## MCP / Tool Suggestions For Next Agent

Use these first:

- `mcp__basehub_mcp.get_content_structure`
  - confirm what is already in BaseHub before changing anything
- `mcp__basehub_mcp.get_token`
  - fetch a fresh write token if direct mutation is needed
- `mcp__basehub_mcp.update_blocks`
  - still useful for renaming/apiName cleanup after successful low-level mutations
- `mcp__basehub_mcp.query_content`
  - verify content can be queried after schema changes
- `functions.exec_command`
  - inspect local SDK types and run local verification scripts
- `functions.apply_patch`
  - for code changes in repo files

Use `multi_tool_use.parallel` for read-only inspection to keep iteration fast.

## Skills Suggestions

No special skill was required in this conversation.

If a future step needs official OpenAI product docs or API guidance, use:

- `openai-docs`

For this task, the work is local repo inspection plus BaseHub MCP/direct API work, so no listed skill is necessary.

## Cautions

- Do not assume the local `.env` token can mutate BaseHub; it is read-scoped.
- Do not keep trying the same high-level MCP `create_blocks` patterns for nested template edits unless you have a concrete new reason.
- Do not reintroduce calculated `pricePerM2`; the user explicitly rejected that.
- There may be draft schema noise in BaseHub from failed attempts. Always re-check current structure before continuing.

## Good Continuation Sequence

1. inspect current BaseHub structure
2. obtain write token
3. perform one direct nested schema mutation for `pricePerM2`
4. if successful, add the rest of `priceHistory`
5. add investment/unit scalar government fields
6. update `src/lib/content.ts`
7. regenerate `basehub-types.d.ts`
8. verify public pages still read and render prices correctly
