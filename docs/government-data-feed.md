# Government Data Feed Handoff

This document summarizes the government-data requirements found in `goverment-docs/` so future agents do not need to re-review the raw files before implementing the export.

## Real Data Constraint

`docs/real_data.json` should be treated as the best current reference for the producer payload we actually need to support. It is narrower than the earlier speculative CMS/export model.

The real payload currently proves these concepts:

- one dataset date per export,
- investments,
- buildings inside investments,
- residential properties inside buildings,
- optional standalone non-residential properties,
- optional current sale price fields only on unsold properties,
- prospectus URL at building level.

It does not prove the need for:

- manual dataset title/description fields in CMS,
- extra price metadata such as VAT/corrections/notes,
- componentized price add-ons attached to units,
- deep developer registry metadata as an XML input requirement.

For XML v1, prefer a generator that consumes the smallest model matching this real payload and derives XML-specific labels/identifiers in code.

## Source Files

Raw reference files are stored in `goverment-docs/`:

- `how-to-automate.txt`: FAQ-style guidance for automatic imports.
- `Przewodnik_automatycznego_zasilania_danych_xml.pdf`: XML automatic import guide.
- `dane.gov.pl_instrukcja_zasilania_XML_dla_deweloperów_1.0.6_20251121_V2.pdf`: developer-specific XML feeding instruction.
- `otwarte_dane_latest.xsd`: XML schema used by `dane.gov.pl`.
- `Szablon_budowy_pliku_xml_v.1.14_12.11.2025.xml`: XML template.
- `Przykład_3_kolejne_publikacje_v.1.14_12.11.2025.xml`: example with multiple daily resources.
- `Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv`: canonical CSV columns and sample rows. The filename appears to contain a typo, but keep the original name.
- `checklist.csv`: launch/compliance checklist extracted for this project.
- `Wskazówki_dotyczące_przygotowania_danych_do_publikacji_w_portalu_v1.0.1.pdf`: data-publication preparation guidance.

## Decisions

- Use one stable XML source file for v1: `/otwarte-dane/feed.xml`.
- Generate a matching lowercase MD5 file at `/otwarte-dane/feed.md5`.
- Use one dataset for the first investment/project.
- Use one daily CSV resource per investment per day.
- Use `availability` = `local` for CSV resources, matching the developer examples. The portal should download the CSV into its own repository.
- Keep all daily resources in the XML while the source is active. If a resource disappears from the XML, imported data can be treated as removed from the portal.
- Keep daily CSV files hosted on the site as public static files. They are expected to be small; do not optimize v1 around deletion.
- Use `/otwarte-dane/` for government-facing files, separate from marketing pages.
- Generate daily snapshots even when no prices changed.
- Use the exact CSV header order from `Wcorcowy_zakres_danych_dotyczących_cen_mieszkań.csv`.
- Use `X` for not-applicable values, matching the sample CSV and XML `specialSigns`.
- Do not require broad CMS overrides for XML metadata if the same values can be generated deterministically from investment data.

## Import Setup

The developer must contact `kontakt@dane.gov.pl` to create a provider profile/source and provide:

- provider name matching the portal profile,
- editor email address or addresses,
- public XML URL,
- public MD5 URL,
- update frequency, expected to be daily for this project.

The XML and MD5 filenames should remain stable for a source. The guide says each XML is prepared for a single source and contains all datasets/resources published or intended to be published through that source.

## XML Rules

The XML must conform to `goverment-docs/otwarte_dane_latest.xsd`.

Important schema and guide constraints:

- Root namespace used by examples: `urn:otwarte-dane:harvester:1.13`.
- A dataset requires `extIdent`, `title`, `description`, `updateFrequency`, `categories`, `resources`, and `tags`.
- A resource requires `extIdent`, `url`, `title`, and `description`.
- Resource `url` must be `https://...`.
- Supplement URLs, if used, must also be `https://...`.
- `extIdent` max length is 36 characters in the XSD. FAQ guidance recommends 36 characters and only letters/digits, without Polish diacritics.
- Resource `dataDate` is the date the CSV represents.
- Dataset and resource status should be `published`.
- Category should be `ECON`, matching the examples.
- Include `hasDynamicData=false`, `hasHighValueData=true`, `hasHighValueDataFromEuropeanCommissionList=false`, `hasResearchData=false`, and `containsProtectedData=false` for resources, matching examples.
- Include `specialSigns` with `X` when the CSV uses `X` placeholders.

The XSD permits unbounded resources, but the FAQ recommends at most about 1000 `<Resource>` entries in one XML file. Treat this as an operational limit.

## MD5 Rules

- The MD5 file is generated from the XML file contents.
- The MD5 URL should be the same as the XML URL with `.md5`.
- The guide notes that MD5 hash case matters and should be lowercase.
- `dane.gov.pl` checks XML name, content type, MD5, and XSD validity.
- The XML should be served with a content type containing `text/xml` or `application/xml`.

## CSV Rules

Each daily CSV should contain the official columns in the exact order from the reference CSV. The CMS data model may be friendlier, but the exporter maps into that canonical order.

Recommended public path:

```text
/otwarte-dane/{investment-slug}/ceny-ofertowe-{developer-slug}-{investment-slug}-{YYYY-MM-DD}.csv
```

Each row should describe one unit/listing and its relevant price components for that day. The daily snapshot should reflect the latest price entries valid on the export date.

For XML v1 implementation, start from the fields visibly present in `docs/real_data.json`:

- dataset date: `offerDate`
- investment label: `investmentName`
- building address fragments: `street`, `number`
- prospectus URL: `prospectusUrl`
- property identity: `propertyId`, `number`, `type`
- property area/address/status: `area`, `fullAddress`, `isSold`
- optional current price: `price`, `pricePerMeter`, `totalPrice`

Treat everything beyond that as deferred unless it is required by the official CSV header or by XSD-valid XML structure.

## End Of Sale

Guidance provided during planning:

- When sales for an investment end, add a note to the dataset description, for example `Sprzedaż inwestycji ... zakończyła się z dniem ...`.
- For automatic XML feeding, update the dataset description in the XML.
- If the XML source reports only that ended investment, the provider must email `kontakt@dane.gov.pl` with the provider name and XML URL to deactivate the source.

For v1, there is one active investment. If later multiple investments are present in one XML source, ending one investment should update that dataset description while keeping the XML source active for other investments.

## Operational Checkpoints

- Around 900 daily resources, contact `kontakt@dane.gov.pl` to confirm whether to create a new source, new dataset, or other archival strategy before hitting the recommended 1000-resource threshold.
- Before launch, validate generated XML against `otwarte_dane_latest.xsd`.
- Before launch, verify Cloudflare Pages serves XML with an acceptable content type and MD5 as plain text.
- Keep generated files inspectable in Git for v1 through a daily GitHub Actions commit-back flow.
