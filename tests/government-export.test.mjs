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
        nip: '5421943411',
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
          latitude: 53.122654,
          longitude: 23.058894,
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

  assert.equal(result.investments[0].offerRows[0].pricePerM2ValidFrom, '2026-06-13 00:00:00')
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

test('normalizeGovernmentSource defaults buyer contact method when CMS field is empty', () => {
  const result = normalizeGovernmentSource(
    {
      developer: {
        name: 'Evenement',
        nip: '5421943411',
        buyerContactMethod: '',
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
          isReportedToGovernment: true,
          latitude: 53.122654,
          longitude: 23.058894,
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
          units: { items: [] },
        },
      ],
    },
    {
      exportDate: '2026-06-22',
      baseUrl: 'https://evenement24.com',
    },
  )

  assert.equal(result.developer.buyerContactMethod, 'Telefonicznie lub mailowo')
})

test('buildStableExtIdent is deterministic, ASCII, and within XSD limit', () => {
  const first = buildStableExtIdent('dataset', 'sloneczna-polana-iv')
  const second = buildStableExtIdent('dataset', 'sloneczna-polana-iv')

  assert.equal(first, second)
  assert.match(first, /^[A-Za-z0-9]{1,36}$/)
  assert.ok(first.length <= 36)
})

test('fixture export follows the Dz.U. 2026 poz. 1489 structure and skips non-available units', async () => {
  const result = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
  })

  assert.equal(result.csvFiles.length, 1)
  assert.equal(result.csvHeader.length, 48)
  assert.equal(new Set(result.csvHeader).size, 48)

  const csvLines = result.csvFiles[0].content.trim().split(/\r?\n/)
  assert.equal(csvLines.length, 2)

  const header = csvLines[0].split(';')
  assert.equal(header.length, 48)
  assert.equal(header[0], 'Firma')
  assert.equal(header[1], 'Numer identyfikacji podatkowej (NIP)')
  assert.match(header[27], /^Długość geograficzna/)
  assert.match(header[28], /^Szerokość geograficzna/)

  const row = parseCsvLine(csvLines[1])
  assert.equal(row.length, 48)
  const field = (name) => row[header.indexOf(name)]

  assert.equal(row[1], '5421943411')
  assert.equal(row[27], '23.058894')
  assert.equal(row[28], '53.122654')
  assert.equal(field('Rodzaj nieruchomości'), 'dom jednorodzinny')
  assert.equal(field('Identyfikator lokalu mieszkalnego albo domu jednorodzinnego'), 'A1')
  assert.equal(
    field('Data i czas, od których obowiązuje cena 1 m2 powierzchni użytkowej lokalu mieszkalnego albo domu jednorodzinnego'),
    '2026-06-13 00:00:00',
  )
  assert.equal(
    field('Data i czas, od których obowiązuje cena lokalu mieszkalnego albo domu jednorodzinnego lub ich części'),
    '2026-06-13 00:00:00',
  )
  assert.match(field('Cena lokalu mieszkalnego albo domu jednorodzinnego lub ich części będących przedmiotem umowy'), /^\d+\.\d{2}$/)
  assert.deepEqual(row.slice(35), Array(13).fill('X'))
  assert.doesNotMatch(csvLines[1], /A2|A3/)
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
    <tags><tag lang="pl">Deweloper</tag></tags>
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
  assert.match(dataset.title, /Ceny ofertowe mieszkań/)
  assert.match(dataset.description, /art\. 19b\. ust\. 1 Ustawy z dnia 20 maja 2021/)
  assert.match(dataset.resources[1].title, /\(2026-06-22\)/)
  assert.match(dataset.resources[1].description, /art\. 19b\. ust\. 1/)
  assert.doesNotMatch(result.feedXml, /<english>/)
  assert.match(result.feedXml, /<tag lang="pl">Deweloper<\/tag>/)
  assert.doesNotMatch(result.feedXml, /ceny mieszkan/)

  const parsed = parseExistingFeedResources(result.feedXml)
  assert.equal(parsed.get(dataset.extIdent).length, 2)
})

test('feed keeps registered-name quotes literal and does not re-escape historical resources', async () => {
  const first = await generateGovernmentFeed({
    exportDate: '2026-06-22',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
    existingFeedXml: '',
  })

  assert.match(first.feedXml, /dewelopera "EVENEMENT M\. Szmurlo" Marek Szmurlo/)
  assert.doesNotMatch(first.feedXml, /&quot;|&amp;quot;/)

  const second = await generateGovernmentFeed({
    exportDate: '2026-06-23',
    fixturePath: 'fixtures/sample-content.json',
    baseUrl: 'https://evenement24.com',
    existingFeedXml: first.feedXml,
  })

  const quoteMatches = second.feedXml.match(/"EVENEMENT M\. Szmurlo"/g) ?? []
  assert.ok(quoteMatches.length >= 4)
  assert.doesNotMatch(second.feedXml, /&quot;|&amp;quot;|&amp;amp;/)
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

function sourceWithCoordinates(coordinates) {
  return {
    developer: {
      name: 'Evenement',
      nip: '542-194-34-11',
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
        isReportedToGovernment: true,
        ...coordinates,
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
        units: { items: [] },
      },
    ],
  }
}

test('normalizeGovernmentSource strips separators from NIP', () => {
  const result = normalizeGovernmentSource(sourceWithCoordinates({ latitude: 53.122654, longitude: 23.058894 }), {
    exportDate: '2026-06-22',
    baseUrl: 'https://evenement24.com',
  })

  assert.equal(result.developer.nip, '5421943411')
})

test('missing investment coordinates yield a validation error', () => {
  assert.throws(
    () =>
      normalizeGovernmentSource(sourceWithCoordinates({ latitude: null, longitude: undefined }), {
        exportDate: '2026-06-22',
        baseUrl: 'https://evenement24.com',
      }),
    /investments\[0\]\.latitude and investments\[0\]\.longitude are required/,
  )
})

test('swapped investment coordinates yield a validation error', () => {
  assert.throws(
    () =>
      normalizeGovernmentSource(sourceWithCoordinates({ latitude: 23.058894, longitude: 53.122654 }), {
        exportDate: '2026-06-22',
        baseUrl: 'https://evenement24.com',
      }),
    /are outside Poland\. Check whether they are swapped\./,
  )
})

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ';') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells
}

async function canRunJava() {
  try {
    await execFile('java', ['-version'])
    return true
  } catch {
    return false
  }
}
