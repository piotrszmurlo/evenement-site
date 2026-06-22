
  ## Government Feed Generator V1

  ### Summary

  Build a government export pipeline that reads all source data from BaseHub, generates daily CSV
  snapshots plus feed.xml and feed.md5, and publishes them through a daily GitHub Actions workflow
  that commits artifacts back into the repo.

  Chosen decisions:

  - Source data: BaseHub for all metadata and offer data
  - Dataset grouping: one XML dataset per investment
  - Row scope: active offer rows only
  - Automation: daily GitHub Actions run
  - Artifact handling: commit generated files back into the repo
  - CSV _hash: omitted

  ### Implementation Changes

  - Add a dedicated generator module that fetches BaseHub content with a government-focused query
    rather than reusing the public-site normalized shape. It should load:
      - developer legal/contact/address fields already stored in BaseHub
      - investment metadata needed for XML dataset/resource labels
      - unit data and effective current price data
      - any BaseHub fields needed to map the official CSV columns

  - Define a normalized government-export model in code with explicit mapping from BaseHub content
    to:
      - DeveloperExport
      - InvestmentExport
      - OfferRowExport
      - DailyResourceExport

  - Generate one CSV per investment per export date under public/otwarte-dane/{investment-slug}/.
      - Use the exact official CSV header order from goverment-docs/
        Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv

      - Export only active offer rows with valid current pricing
      - Fill not-applicable columns with X
      - Omit the _hash column entirely

  - Generate one stable XML feed at public/otwarte-dane/feed.xml.
      - One dataset per investment
      - One resource per daily CSV snapshot for that investment
      - Keep all previously generated daily resources in the XML while the source remains active
      - Use deterministic extIdent values derived from stable slugs/IDs and capped to XSD limits

  - Generate public/otwarte-dane/feed.md5 from the XML bytes using lowercase output.
  - Add XML validation against goverment-docs/otwarte_dane_latest.xsd as part of generation failure
    checks.

  - Add a typed BaseHub-to-government validation layer that hard-fails generation when required
    government fields are missing or invalid.

  ### Public Interfaces / Runtime

  - Add a script entrypoint such as pnpm generate-government-feed.
  - The script accepts an optional export date override; default is the current Warsaw date.
  - The script writes:
      - daily CSV files
      - refreshed feed.xml
      - refreshed feed.md5
      - runs on a cron schedule
      - installs dependencies
      - runs the generator
      - commits changed files back to the repo
      - relies on repo secrets for BaseHub access

  ### Test Plan

  - Unit tests for BaseHub-to-export normalization:
      - required field validation
      - current effective price selection by export date
      - skipping inactive/sold rows
      - deterministic extIdent generation

  - CSV tests:
      - exact header order
      - placeholder X handling
      - row output for active residential offers

  - XML tests:
      - dataset/resource structure
      - stable URL generation
      - retention of historical daily resources
      - XSD validation pass

  - End-to-end generator test using a local fixture that simulates BaseHub content and asserts
    generated CSV, XML, and MD5 outputs.

  ### Assumptions And Defaults

  - BaseHub already contains all required legal/company/address metadata needed for CSV output.
  - opis danych and similar descriptive text will come from BaseHub fields, not hardcoded config.
  - Daily generation is required even when prices do not change.
  - The public base URL used in XML resource links will come from deployment configuration and must
    resolve to the stable production domain.

  - Standalone parking/storage/component-style inventory is out of scope for v1 unless it is already
    modeled in BaseHub in a way that maps cleanly to the official CSV rows.

  - feed.xml is a single stable source file containing all active investment datasets and their
    retained historical daily resources.