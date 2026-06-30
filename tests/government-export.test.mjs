import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { promisify } from 'node:util'
import {
  buildStableExtIdent,
  generateGovernmentFeed,
  normalizeGovernmentSource,
  parseExistingFeedResources,
  selectEffectivePrice,
  validateFeedXmlAgainstXsd,
  writeGovernmentFeed,
} from '../src/lib/government-export/index.mjs'

const execFile = promisify(execFileCallback)
const XSD_PATH = path.resolve(process.cwd(), 'goverment-docs/otwarte_dane_latest.xsd')
const hasJavaRuntime = await canRunJava()

test('normalizeGovernmentSource accepts BaseHub ISO datetime validFrom values', () => {
  const result = normalizeGovernmentSource(
    {
      developer: {
        name: 'Evenement',
        phone: '+48 600 000 000',
        email: 'test@example.com',
        websiteUrl: 'https://evenement24.com',
        registeredAddress: {
          voivodeship: 'podlaskie',
          county: 'bialostocki',
          municipality: 'Choroszcz',
          city: 'Krupniki',
          street: 'Krokusowa',
          buildingNumber: '12',
          unitNumber: '',
          postalCode: '16-070',
        },
        salesOfficeAddress: {
          voivodeship: 'podlaskie',
          county: 'Bialystok',
          municipality: 'Bialystok',
          city: 'Bialystok',
          street: 'Mickiewicza',
          buildingNumber: '7',
          unitNumber: '2',
          postalCode: '15-213',
        },
      },
      investments: [
        {
          name: 'Sloneczna Polana IV etap',
          slug: 'sloneczna-polana-iv',
          salesStatus: 'active',
          isReportedToGovernment: true,
          prospectusFile: { url: 'https://evenement24.com/prospectus.pdf' },
          investmentAddress: {
            voivodeship: 'podlaskie',
            county: 'bialostocki',
            municipality: 'Choroszcz',
            city: 'Krupniki',
            street: 'Rozana',
            buildingNumber: '1',
            unitNumber: '',
            postalCode: '16-070',
          },
          units: {
            items: [
              {
                unitNumber: 'A1',
                slug: 'a1',
                propertyType: 'dom w zabudowie szeregowej',
                status: 'available',
                usableAreaM2: 119.14,
                governmentReportingEnabled: true,
                includedInPriceNotes: '',
                priceHistory: {
                  items: [
                    {
                      validFrom: '2026-06-13T00:00:00.000Z',
                      pricePerM2: 6500.08,
                      baseTotalPrice: 774410,
                      totalPriceWithComponents: 789410,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    {
      exportDate: '2026-06-22',
      baseUrl: 'https://evenement24.com',
    },
  )

  assert.equal(result.investments[0].offerRows[0].pricePerM2ValidFrom, '2026-06-13')
})

test('selectEffectivePrice picks latest valid price on export date', () => {
  const result = selectEffectivePrice(
    [
      { validFrom: '2026-06-01', pricePerM2: 6000, baseTotalPrice: 700000 },
      { validFrom: '2026-06-15', pricePerM2: 6200, baseTotalPrice: 720000 },
      { validFrom: '2026-07-01', pricePerM2: 6500, baseTotalPrice: 750000 },
    ],
    '2026-06-22',
  )

  assert.equal(result.validFrom, '2026-06-15')
  assert.equal(result.baseTotalPrice, 720000)
})

test('buildStableExtIdent is deterministic, ASCII, and within XSD limit', () => {
  const first = buildStableExtIdent('dataset', 'sloneczna-polana-iv')
  const second = buildStableExtIdent('dataset', 'sloneczna-polana-iv')

  assert.equal(first, second)
  assert.match(first, /^[A-Za-z0-9]{1,36}$/)
  assert.ok(first.length <= 36)
})

test('fixture export generates exact CSV header and skips non-available units', async () => {
  const result = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
  })

  assert.equal(result.csvFiles.length, 1)

  const csvLines = result.csvFiles[0].content.trim().split(/\r?\n/)
  assert.equal(csvLines.length, 2)
  assert.ok(csvLines[0].startsWith('Nazwa dewelopera;Forma prawna dewelopera;Nr KRS;'))
  assert.match(csvLines[1], /A1/)
  assert.doesNotMatch(csvLines[1], /A2|A3/)
  assert.match(csvLines[1], /789410\.00/)
  assert.match(csvLines[1], /;X;X;X;X;/)
})

test('feed keeps historical daily resources for active dataset', async () => {
  const preview = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
  })
  const datasetExtIdent = preview.feedModel.datasets[0].extIdent
  const previousFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dataset status="published">
    <extIdent>${datasetExtIdent}</extIdent>
    <title><polish>old</polish></title>
    <description><polish>old</polish></description>
    <updateFrequency>daily</updateFrequency>
    <categories><category>ECON</category></categories>
    <resources>
      <resource status="published">
        <extIdent>${buildStableExtIdent('res', `${datasetExtIdent}-2026-06-21`)}</extIdent>
        <url>https://evenement24.com/otwarte-dane/sloneczna-polana-iv/ceny-ofertowe-evenement-sloneczna-polana-iv-2026-06-21.csv</url>
        <title><polish>old resource</polish></title>
        <description><polish>old resource description</polish></description>
        <dataDate>2026-06-21</dataDate>
      </resource>
    </resources>
    <tags><tag lang="pl">deweloper</tag></tags>
  </dataset>
</ns2:datasets>`

  const result = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
    existingFeedXml: previousFeedXml,
  })

  const dataset = result.feedModel.datasets[0]
  assert.equal(dataset.resources.length, 2)
  assert.deepEqual(
    dataset.resources.map((resource) => resource.dataDate),
    ['2026-06-21', '2026-06-22'],
  )

  const parsed = parseExistingFeedResources(result.feedXml)
  assert.equal(parsed.get(dataset.extIdent).length, 2)
})

test('writeGovernmentFeed writes csv, xml and lowercase md5', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'government-feed-'))
  const result = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
    outputDir,
  })

  await writeGovernmentFeed(result, outputDir)

  const feedXml = await readFile(path.join(outputDir, 'feed.xml'), 'utf8')
  const feedMd5 = await readFile(path.join(outputDir, 'feed.md5'), 'utf8')

  assert.equal(feedXml, result.feedXml)
  assert.equal(feedMd5, crypto.createHash('md5').update(feedXml, 'utf8').digest('hex'))
  assert.equal(feedMd5, feedMd5.toLowerCase())
})

test(
  'generated feed validates against the government XSD',
  { skip: !hasJavaRuntime },
  async () => {
    const result = await generateGovernmentFeed({
      exportDate: '2026-06-22',
      fixturePath: 'fixtures/sample-content.json',
      baseUrl: 'https://evenement24.com',
      xsdValidationMode: 'require',
    })

    await assert.doesNotReject(() =>
      validateFeedXmlAgainstXsd(result.feedXml, XSD_PATH, { mode: 'require' }),
    )
  },
)

test('missing prospectus yields validation error instead of crashing', () => {
  assert.throws(
    () =>
      normalizeGovernmentSource(
        {
          developer: {
            name: 'Evenement',
            phone: '+48 600 000 000',
            email: 'test@example.com',
            websiteUrl: 'https://evenement24.com',
            registeredAddress: {
              voivodeship: 'podlaskie',
              county: 'bialostocki',
              municipality: 'Choroszcz',
              city: 'Krupniki',
              street: 'Krokusowa',
              buildingNumber: '12',
              unitNumber: '',
              postalCode: '16-070',
            },
            salesOfficeAddress: {
              voivodeship: 'podlaskie',
              county: 'Bialystok',
              municipality: 'Bialystok',
              city: 'Bialystok',
              street: 'Mickiewicza',
              buildingNumber: '7',
              unitNumber: '2',
              postalCode: '15-213',
            },
          },
          investments: [
            {
              name: 'Sloneczna Polana IV etap',
              slug: 'sloneczna-polana-iv',
              salesStatus: 'active',
              isReportedToGovernment: true,
              prospectusFile: null,
              investmentAddress: {
                voivodeship: 'podlaskie',
                county: 'bialostocki',
                municipality: 'Choroszcz',
                city: 'Krupniki',
                street: 'Rozana',
                buildingNumber: '1',
                unitNumber: '',
                postalCode: '16-070',
              },
              units: {
                items: [
                  {
                    unitNumber: 'A1',
                    slug: 'a1',
                    propertyType: 'dom w zabudowie szeregowej',
                    status: 'available',
                    usableAreaM2: 119.14,
                    governmentReportingEnabled: true,
                    includedInPriceNotes: '',
                    priceHistory: {
                      items: [
                        {
                          validFrom: '2026-06-13T00:00:00.000Z',
                          pricePerM2: 6500.08,
                          baseTotalPrice: 774410,
                          totalPriceWithComponents: 789410,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          exportDate: '2026-06-22',
          baseUrl: 'https://evenement24.com',
        },
      ),
    /Government export validation failed:\n- investments\[0\]\.prospectusFile\.url must be a valid https:\/\/ URL\./,
  )
})

async function canRunJava() {
  try {
    await execFile('java', ['-version'])
    return true
  } catch {
    return false
  }
}
