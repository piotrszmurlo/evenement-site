import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { basehub } from 'basehub'

const GOVERNMENT_NAMESPACE = 'urn:otwarte-dane:harvester:1.13'
const DEFAULT_BASE_URL = 'https://evenement24.com'
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), 'public/otwarte-dane')
const DEFAULT_BUYER_CONTACT_METHOD = 'Telefonicznie lub mailowo'
const ART_19B_CITATION =
  'art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695)'
const FEED_PATH = 'feed.xml'
const FEED_MD5_PATH = 'feed.md5'
// Header row: field names A1–H4 from the annex to Dz.U. 2026 poz. 1489 (in force since 2026-11-11).
const CSV_REFERENCE_PATH = path.resolve(process.cwd(), 'goverment-docs/struktura_danych_dz_u_2026_poz_1489.csv')
const XSD_PATH = path.resolve(process.cwd(), 'goverment-docs/otwarte_dane_latest.xsd')
const JAVA_XSD_VALIDATOR_PATH = path.resolve(process.cwd(), 'scripts/ValidateXmlAgainstXsd.java')
const execFile = promisify(execFileCallback)

const GOVERNMENT_CONTENT_QUERY = {
  content: {
    developer: {
      name: true,
      nip: true,
      additionalSalesLocations: true,
      buyerContactMethod: true,
      registeredAddress: {
        voivodeship: true,
        county: true,
        municipality: true,
        city: true,
        street: true,
        buildingNumber: true,
        unitNumber: true,
        postalCode: true,
      },
      salesOfficeAddress: {
        voivodeship: true,
        county: true,
        municipality: true,
        city: true,
        street: true,
        buildingNumber: true,
        unitNumber: true,
        postalCode: true,
      },
    },
    investments: {
      items: {
        name: true,
        slug: true,
        salesStatus: true,
        salesEndedAt: true,
        isReportedToGovernment: true,
        governmentDatasetExtIdent: true,
        governmentDatasetTitle: true,
        governmentDatasetDescription: true,
        longitude: true,
        latitude: true,
        investmentAddress: {
          voivodeship: true,
          county: true,
          municipality: true,
          city: true,
          street: true,
          buildingNumber: true,
          unitNumber: true,
          postalCode: true,
        },
        units: {
          items: {
            unitNumber: true,
            slug: true,
            propertyType: true,
            status: true,
            usableAreaM2: true,
            governmentReportingEnabled: true,
            includedInPriceNotes: true,
            priceHistory: {
              items: {
                validFrom: true,
                pricePerM2: true,
                baseTotalPrice: true,
                totalPriceWithComponents: true,
                vatIncluded: true,
                note: true,
                correctionOfPreviousEntry: true,
              },
            },
          },
        },
      },
    },
  },
}

const CSV_COLUMN_KEYS = [
  // A. Podmiot obowiązany
  'developerName',
  'developerNip',
  // B. Adres siedziby
  'registeredVoivodeship',
  'registeredCounty',
  'registeredMunicipality',
  'registeredCity',
  'registeredStreet',
  'registeredBuildingNumber',
  'registeredUnitNumber',
  'registeredPostalCode',
  // C. Adres lokalu sprzedaży
  'salesOfficeVoivodeship',
  'salesOfficeCounty',
  'salesOfficeMunicipality',
  'salesOfficeCity',
  'salesOfficeStreet',
  'salesOfficeBuildingNumber',
  'salesOfficeUnitNumber',
  'salesOfficePostalCode',
  'additionalSalesLocations',
  'buyerContactMethod',
  // D. Lokalizacja przedsięwzięcia
  'investmentVoivodeship',
  'investmentCounty',
  'investmentMunicipality',
  'investmentCity',
  'investmentStreet',
  'investmentBuildingNumber',
  'investmentPostalCode',
  'investmentLongitude',
  'investmentLatitude',
  // E. Lokal mieszkalny albo dom jednorodzinny
  'propertyType',
  'unitIdentifier',
  'pricePerM2',
  'pricePerM2ValidFrom',
  'totalPrice',
  'totalPriceValidFrom',
  // F. Pomieszczenia przynależne
  'appurtenantRoomType',
  'appurtenantRoomIdentifier',
  'appurtenantRoomPrice',
  'appurtenantRoomPriceValidFrom',
  'appurtenantRoomUnitIdentifier',
  // G. Prawa niezbędne
  'useRightsDescription',
  'useRightsPrice',
  'useRightsPriceValidFrom',
  'useRightsUnitIdentifier',
  // H. Inne świadczenia pieniężne
  'otherFeesDescription',
  'otherFeesPrice',
  'otherFeesPriceValidFrom',
  'otherFeesUnitIdentifier',
]

export async function loadGovernmentSourceFromBasehub(env = process.env) {
  if (!hasBasehubCredentials(env)) {
    throw new Error(
      'BaseHub content is required for government export. Set BASEHUB_URL or BASEHUB_TEAM and BASEHUB_REPO, plus BASEHUB_TOKEN if needed.',
    )
  }

  const data = await basehub(getBasehubConfig(env)).query(GOVERNMENT_CONTENT_QUERY)
  return data.content
}

export async function loadGovernmentSourceFromFixture(fixturePath) {
  const raw = await readFile(path.resolve(process.cwd(), fixturePath), 'utf8')
  return JSON.parse(raw)
}

export async function generateGovernmentFeed(options = {}) {
  const exportDate = options.exportDate ?? getWarsawDateString()
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.GOVERNMENT_EXPORT_BASE_URL ?? DEFAULT_BASE_URL)
  const source =
    options.source ??
    (options.fixturePath
      ? await loadGovernmentSourceFromFixture(options.fixturePath)
      : await loadGovernmentSourceFromBasehub(options.env))

  const normalized = normalizeGovernmentSource(source, { exportDate, baseUrl })
  const csvHeader = await readGovernmentCsvHeader()
  if (csvHeader.length !== CSV_COLUMN_KEYS.length) {
    throw new Error(
      `CSV header has ${csvHeader.length} columns but the export defines ${CSV_COLUMN_KEYS.length}.`,
    )
  }
  const existingFeedXml =
    options.existingFeedXml ??
    (await readIfExists(path.join(options.outputDir ?? DEFAULT_OUTPUT_DIR, FEED_PATH)))

  const existingResourcesByDataset = parseExistingFeedResources(existingFeedXml)
  const datasets = normalized.investments.map((investment) =>
    buildDatasetExport({
      developer: normalized.developer,
      investment,
      exportDate,
      baseUrl,
      existingResources: existingResourcesByDataset.get(investment.dataset.extIdent) ?? [],
    }),
  )

  const csvFiles = datasets.map((dataset) => ({
    investmentSlug: dataset.investmentSlug,
    relativePath: dataset.currentResource.relativePath,
    absolutePath: path.join(options.outputDir ?? DEFAULT_OUTPUT_DIR, dataset.currentResource.relativePath),
    content: buildCsvContent(csvHeader, dataset.offerRows),
  }))

  const feedModel = { datasets: datasets.map((dataset) => dataset.feedDataset) }
  validateFeedModelAgainstSchema(feedModel, XSD_PATH)
  const feedXml = buildFeedXml(feedModel)
  validateFeedXml(feedXml)
  await validateFeedXmlAgainstXsd(feedXml, XSD_PATH, {
    mode: options.xsdValidationMode ?? process.env.GOVERNMENT_XSD_VALIDATION_MODE ?? 'auto',
  })
  const feedMd5 = crypto.createHash('md5').update(feedXml, 'utf8').digest('hex')

  return {
    exportDate,
    baseUrl,
    csvHeader,
    csvFiles,
    feedModel,
    feedXml,
    feedMd5,
    outputDir: options.outputDir ?? DEFAULT_OUTPUT_DIR,
  }
}

export async function writeGovernmentFeed(result, outputDir = result.outputDir ?? DEFAULT_OUTPUT_DIR) {
  await mkdir(outputDir, { recursive: true })

  for (const csvFile of result.csvFiles) {
    await mkdir(path.dirname(csvFile.absolutePath), { recursive: true })
    await writeFile(csvFile.absolutePath, csvFile.content, 'utf8')
  }

  await writeFile(path.join(outputDir, FEED_PATH), result.feedXml, 'utf8')
  await writeFile(path.join(outputDir, FEED_MD5_PATH), result.feedMd5, 'utf8')
}

export function selectEffectivePrice(priceHistory, exportDate) {
  const exportTimestamp = Date.parse(exportDate)
  if (Number.isNaN(exportTimestamp)) {
    throw new Error(`Invalid export date "${exportDate}". Expected YYYY-MM-DD.`)
  }

  return [...priceHistory]
    .filter((entry) => Date.parse(entry.validFrom) <= exportTimestamp)
    .sort((left, right) => Date.parse(right.validFrom) - Date.parse(left.validFrom))[0]
}

export function buildStableExtIdent(prefix, stableKey) {
  const normalizedPrefix = sanitizeExtIdent(prefix).slice(0, 6) || 'feed'
  const normalizedKey = sanitizeExtIdent(stableKey)
  const hash = crypto.createHash('md5').update(`${normalizedPrefix}:${stableKey}`).digest('hex').slice(0, 10)
  const stemBudget = Math.max(1, 36 - normalizedPrefix.length - hash.length)
  const stem = normalizedKey.slice(0, stemBudget)
  return `${normalizedPrefix}${hash}${stem}`.slice(0, 36)
}

export async function readGovernmentCsvHeader() {
  const raw = await readFile(CSV_REFERENCE_PATH, 'utf8')
  const [headerLine] = raw.split(/\r?\n/)
  return headerLine.split(';')
}

export function buildCsvContent(csvHeader, offerRows) {
  const rows = [csvHeader, ...offerRows.map((row) => CSV_COLUMN_KEYS.map((key) => row[key]))]
  return `${rows.map((row) => row.map(escapeCsvValue).join(';')).join('\r\n')}\r\n`
}

function buildDatasetExport({ developer, investment, exportDate, baseUrl, existingResources }) {
  const fileName = `ceny-ofertowe-${developer.slug}-${investment.slug}-${exportDate}.csv`
  const relativePath = path.posix.join(investment.slug, fileName)
  const resourceUrl = `${baseUrl}/otwarte-dane/${relativePath}`
  const currentResource = {
    extIdent: buildStableExtIdent('res', `${investment.dataset.extIdent}-${exportDate}`),
    url: resourceUrl,
    title: buildResourceTitle(developer.name, investment.name, exportDate),
    description: buildResourceDescription(developer.name, investment.name, exportDate),
    dataDate: exportDate,
    relativePath,
  }

  const retainedResources = mergeHistoricalResources(existingResources, currentResource)
  const feedDataset = {
    extIdent: investment.dataset.extIdent,
    title: investment.dataset.title,
    description: investment.dataset.description,
    resources: retainedResources,
  }

  return {
    investmentSlug: investment.slug,
    offerRows: investment.offerRows,
    currentResource,
    feedDataset,
  }
}

function mergeHistoricalResources(existingResources, currentResource) {
  const byExtIdent = new Map(existingResources.map((resource) => [resource.extIdent, resource]))
  byExtIdent.set(currentResource.extIdent, currentResource)

  return [...byExtIdent.values()].sort((left, right) => left.dataDate.localeCompare(right.dataDate))
}

export function normalizeGovernmentSource(source, { exportDate, baseUrl }) {
  const errors = []
  const developer = normalizeDeveloper(source?.developer, baseUrl, errors)
  const investments = getInvestmentList(source?.investments)
    .filter((investment) => investment?.isReportedToGovernment !== false)
    .map((investment, investmentIndex) =>
      normalizeInvestment(investment, investmentIndex, developer, exportDate, baseUrl, errors),
    )

  if (investments.length === 0) {
    errors.push('At least one investment must be marked for government reporting.')
  }

  if (errors.length > 0) {
    throw new Error(`Government export validation failed:\n- ${errors.join('\n- ')}`)
  }

  return {
    developer,
    investments,
  }
}

function normalizeDeveloper(developer, baseUrl, errors) {
  validateRequiredString(errors, 'developer.name', developer?.name)
  const nip = normalizeNip(developer?.nip)
  if (!/^\d{10}$/.test(nip)) {
    errors.push('developer.nip must be 10 digits (A2, Dz.U. 2026 poz. 1489).')
  }
  validateAddress(errors, 'developer.registeredAddress', developer?.registeredAddress)
  validateAddress(errors, 'developer.salesOfficeAddress', developer?.salesOfficeAddress)

  return {
    name: developer.name.trim(),
    slug: sanitizeSlug(developer.name),
    nip,
    additionalSalesLocations: normalizeCsvCell(developer.additionalSalesLocations),
    buyerContactMethod: normalizeOptionalString(developer.buyerContactMethod) ?? DEFAULT_BUYER_CONTACT_METHOD,
    registeredAddress: normalizeAddress(developer.registeredAddress),
    salesOfficeAddress: normalizeAddress(developer.salesOfficeAddress),
  }
}

function normalizeInvestment(investment, investmentIndex, developer, exportDate, baseUrl, errors) {
  const label = `investments[${investmentIndex}]`
  validateRequiredString(errors, `${label}.name`, investment?.name)
  validateRequiredString(errors, `${label}.slug`, investment?.slug)
  validateAddress(errors, `${label}.investmentAddress`, investment?.investmentAddress)
  const coordinates = normalizeCoordinates(investment, label, errors)

  const reportableUnits = (investment?.units?.items ?? []).filter(
    (unit) => unit?.governmentReportingEnabled === true,
  )

  const offerRows = reportableUnits.flatMap((unit, unitIndex) => {
    const unitLabel = `${label}.units[${unitIndex}]`
    validateRequiredString(errors, `${unitLabel}.unitNumber`, unit?.unitNumber)
    validateRequiredString(errors, `${unitLabel}.slug`, unit?.slug)
    validatePositiveNumber(errors, `${unitLabel}.usableAreaM2`, unit?.usableAreaM2)

    if (!Object.hasOwn(CSV_PROPERTY_TYPES, unit?.propertyType ?? '')) {
      errors.push(`${unitLabel}.propertyType is invalid.`)
    }

    if (!['available', 'reserved', 'sold'].includes(unit?.status)) {
      errors.push(`${unitLabel}.status is invalid.`)
    }

    const priceHistory = normalizePriceHistory(unit?.priceHistory?.items ?? [], unitLabel, errors)

    if (unit?.status !== 'available') {
      return []
    }

    const currentPrice = selectEffectivePrice(priceHistory, exportDate)
    if (!currentPrice) {
      errors.push(`${unitLabel} is available but has no current price for export date ${exportDate}.`)
      return []
    }

    return [
      createOfferRow({
        developer,
        investment,
        coordinates,
        unit,
        currentPrice,
      }),
    ]
  })

  const datasetExtIdent =
    normalizeOptionalExtIdent(investment?.governmentDatasetExtIdent) ??
    buildStableExtIdent('ds', `${developer.slug}-${investment.slug}`)

  const title =
    normalizeOptionalString(investment?.governmentDatasetTitle) ??
    buildDatasetTitle(developer.name, investment.name)

  const description =
    normalizeOptionalString(investment?.governmentDatasetDescription) ??
    buildDatasetDescription(developer.name, investment)

  validateTextLength(errors, `${label}.datasetTitle`, title, 300)
  validateTextLength(errors, `${label}.datasetDescription`, description, 1000)

  return {
    name: investment.name.trim(),
    slug: investment.slug.trim(),
    dataset: {
      extIdent: datasetExtIdent,
      title,
      description,
    },
    offerRows,
  }
}

function normalizePriceHistory(priceHistory, unitLabel, errors) {
  return priceHistory
    .map((entry, entryIndex) => {
      const label = `${unitLabel}.priceHistory[${entryIndex}]`
      validateRequiredString(errors, `${label}.validFrom`, entry?.validFrom)
      validatePositiveNumber(errors, `${label}.pricePerM2`, entry?.pricePerM2)
      validatePositiveNumber(errors, `${label}.baseTotalPrice`, entry?.baseTotalPrice)

      if (entry?.totalPriceWithComponents != null) {
        validatePositiveNumber(errors, `${label}.totalPriceWithComponents`, entry.totalPriceWithComponents)
      }

      if (!BASEHUB_VALID_FROM_RE.test(entry?.validFrom ?? '')) {
        errors.push(`${label}.validFrom must be a BaseHub ISO date (YYYY-MM-DDT00:00:00.000Z).`)
      }

      return {
        validFrom: entry.validFrom.slice(0, 10),
        pricePerM2: entry.pricePerM2,
        baseTotalPrice: entry.baseTotalPrice,
        totalPriceWithComponents: entry.totalPriceWithComponents ?? null,
      }
    })
    .sort((left, right) => left.validFrom.localeCompare(right.validFrom))
}

function createOfferRow({ developer, investment, coordinates, unit, currentPrice }) {
  const na = 'X'
  const priceDateTime = formatDateTime(currentPrice.validFrom)
  const registered = developer.registeredAddress
  const salesOffice = developer.salesOfficeAddress
  const location = normalizeAddress(investment.investmentAddress)

  return {
    developerName: developer.name,
    developerNip: developer.nip,
    registeredVoivodeship: registered.voivodeship,
    registeredCounty: registered.county,
    registeredMunicipality: registered.municipality,
    registeredCity: registered.city,
    registeredStreet: registered.street,
    registeredBuildingNumber: registered.buildingNumber,
    registeredUnitNumber: registered.unitNumber,
    registeredPostalCode: registered.postalCode,
    salesOfficeVoivodeship: salesOffice.voivodeship,
    salesOfficeCounty: salesOffice.county,
    salesOfficeMunicipality: salesOffice.municipality,
    salesOfficeCity: salesOffice.city,
    salesOfficeStreet: salesOffice.street,
    salesOfficeBuildingNumber: salesOffice.buildingNumber,
    salesOfficeUnitNumber: salesOffice.unitNumber,
    salesOfficePostalCode: salesOffice.postalCode,
    additionalSalesLocations: developer.additionalSalesLocations,
    buyerContactMethod: developer.buyerContactMethod,
    investmentVoivodeship: location.voivodeship,
    investmentCounty: location.county,
    investmentMunicipality: location.municipality,
    investmentCity: location.city,
    investmentStreet: location.street,
    investmentBuildingNumber: location.buildingNumber,
    investmentPostalCode: location.postalCode,
    investmentLongitude: formatCoordinate(coordinates.longitude),
    investmentLatitude: formatCoordinate(coordinates.latitude),
    propertyType: CSV_PROPERTY_TYPES[unit.propertyType],
    unitIdentifier: unit.unitNumber.trim(),
    pricePerM2: formatAmount(currentPrice.pricePerM2),
    pricePerM2ValidFrom: priceDateTime,
    totalPrice: formatAmount(currentPrice.baseTotalPrice),
    totalPriceValidFrom: priceDateTime,
    // F–H are conditional; the CMS does not model separately priced appurtenant rooms, rights or other fees.
    appurtenantRoomType: na,
    appurtenantRoomIdentifier: na,
    appurtenantRoomPrice: na,
    appurtenantRoomPriceValidFrom: na,
    appurtenantRoomUnitIdentifier: na,
    useRightsDescription: na,
    useRightsPrice: na,
    useRightsPriceValidFrom: na,
    useRightsUnitIdentifier: na,
    otherFeesDescription: na,
    otherFeesPrice: na,
    otherFeesPriceValidFrom: na,
    otherFeesUnitIdentifier: na,
  }
}

function buildDatasetTitle(developerName, investmentName) {
  return `Ceny ofertowe mieszkań dewelopera ${developerName} — inwestycja ${investmentName}`
}

function buildDatasetDescription(developerName, investment) {
  const investmentName = investment.name.trim()
  let description = `Zbiór danych zawiera informacje o cenach ofertowych mieszkań dewelopera ${developerName} w ramach inwestycji ${investmentName}, udostępniane zgodnie z ${ART_19B_CITATION}.`

  if (investment.salesStatus === 'ended' && investment.salesEndedAt) {
    return `${description} Sprzedaż inwestycji zakończyła się z dniem ${investment.salesEndedAt}.`
  }

  return description
}

function buildResourceTitle(developerName, investmentName, exportDate) {
  return `Ceny ofertowe mieszkań dewelopera ${developerName} — inwestycja ${investmentName} (${exportDate})`
}

function buildResourceDescription(developerName, investmentName, exportDate) {
  return `Dane dotyczące cen ofertowych mieszkań dewelopera ${developerName} w inwestycji ${investmentName}, udostępnione ${exportDate} zgodnie z ${ART_19B_CITATION}.`
}

export function parseExistingFeedResources(feedXml) {
  const resourcesByDataset = new Map()
  if (!feedXml) {
    return resourcesByDataset
  }

  const datasetMatches = feedXml.matchAll(/<dataset\b[^>]*>([\s\S]*?)<\/dataset>/g)
  for (const datasetMatch of datasetMatches) {
    const datasetXml = datasetMatch[0]
    const datasetExtIdent = extractXmlTag(datasetXml, 'extIdent')
    if (!datasetExtIdent) {
      continue
    }

    const resources = [...datasetXml.matchAll(/<resource\b[^>]*>([\s\S]*?)<\/resource>/g)].map((resourceMatch) => {
      const resourceXml = resourceMatch[0]
      return {
        extIdent: extractXmlTag(resourceXml, 'extIdent'),
        url: extractXmlTag(resourceXml, 'url'),
        title: unescapeXml(extractXmlTag(resourceXml, 'polish')),
        description: unescapeXml(extractSecondXmlTag(resourceXml, 'polish')),
        dataDate: extractXmlTag(resourceXml, 'dataDate'),
      }
    }).filter((resource) => resource.extIdent && resource.url && resource.title && resource.description && resource.dataDate)

    resourcesByDataset.set(datasetExtIdent, resources)
  }

  return resourcesByDataset
}

export function buildFeedXml(feedModel) {
  const datasetsXml = feedModel.datasets
    .map((dataset) => {
      const resourcesXml = dataset.resources
        .map((resource) => {
          return `    <resource status="published">
      <extIdent>${escapeXml(resource.extIdent)}</extIdent>
      <url>${escapeXml(resource.url)}</url>
      <title>
        <polish>${escapeXml(resource.title)}</polish>
      </title>
      <description>
        <polish>${escapeXml(resource.description)}</polish>
      </description>
      <availability>local</availability>
      <dataDate>${escapeXml(resource.dataDate)}</dataDate>
      <specialSigns>
        <specialSign>X</specialSign>
      </specialSigns>
      <hasDynamicData>false</hasDynamicData>
      <hasHighValueData>true</hasHighValueData>
      <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
      <hasResearchData>false</hasResearchData>
      <containsProtectedData>false</containsProtectedData>
    </resource>`
        })
        .join('\n')

      return `  <dataset status="published">
    <extIdent>${escapeXml(dataset.extIdent)}</extIdent>
    <title>
      <polish>${escapeXml(dataset.title)}</polish>
    </title>
    <description>
      <polish>${escapeXml(dataset.description)}</polish>
    </description>
    <updateFrequency>daily</updateFrequency>
    <hasDynamicData>false</hasDynamicData>
    <hasHighValueData>true</hasHighValueData>
    <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
    <hasResearchData>false</hasResearchData>
    <categories>
      <category>ECON</category>
    </categories>
    <resources>
${resourcesXml}
    </resources>
    <tags>
      <tag lang="pl">Deweloper</tag>
    </tags>
  </dataset>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="${GOVERNMENT_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${datasetsXml}
</ns2:datasets>
`
}

export function validateFeedModelAgainstSchema(feedModel, xsdPath) {
  if (!feedModel?.datasets?.length) {
    throw new Error('Generated feed must contain at least one dataset.')
  }

  if (!xsdPath) {
    throw new Error('XSD path is required for validation.')
  }

  const extIdents = new Set()

  for (const dataset of feedModel.datasets) {
    validateExtIdent(dataset.extIdent, `dataset:${dataset.title}`)
    validateMaxLength(dataset.title, 300, `dataset "${dataset.extIdent}" title`)
    validateMaxLength(dataset.description, 1000, `dataset "${dataset.extIdent}" description`)
    if (extIdents.has(dataset.extIdent)) {
      throw new Error(`Duplicate dataset extIdent "${dataset.extIdent}".`)
    }
    extIdents.add(dataset.extIdent)

    if (!dataset.resources.length) {
      throw new Error(`Dataset "${dataset.extIdent}" must contain at least one resource.`)
    }

    for (const resource of dataset.resources) {
      validateExtIdent(resource.extIdent, `resource:${resource.url}`)
      if (typeof resource.url !== 'string' || !resource.url.startsWith('https://')) {
        throw new Error(`Resource "${resource.extIdent}" must use an https:// URL.`)
      }
      validateMaxLength(resource.title, 300, `resource "${resource.extIdent}" title`)
      validateMaxLength(resource.description, 1000, `resource "${resource.extIdent}" description`)
      if (!isIsoDate(resource.dataDate)) {
        throw new Error(`Resource "${resource.extIdent}" has invalid dataDate "${resource.dataDate}".`)
      }
      if (extIdents.has(resource.extIdent)) {
        throw new Error(`Duplicate resource extIdent "${resource.extIdent}".`)
      }
      extIdents.add(resource.extIdent)
    }
  }
}

export async function validateFeedXmlAgainstXsd(feedXml, xsdPath, options = {}) {
  if (!xsdPath) {
    throw new Error('XSD path is required for XML schema validation.')
  }

  const mode = options.mode ?? 'auto'

  if (mode === 'off') {
    return { validated: false, validator: null }
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'government-feed-xsd-'))
  const tempXmlPath = path.join(tempDir, FEED_PATH)

  try {
    await writeFile(tempXmlPath, feedXml, 'utf8')

    try {
      await execFile('java', [JAVA_XSD_VALIDATOR_PATH, tempXmlPath, xsdPath], {
        cwd: process.cwd(),
      })
    } catch (error) {
      if (error?.code === 'ENOENT' && mode === 'auto') {
        return { validated: false, validator: 'java' }
      }

      if (error?.code === 'ENOENT') {
        throw new Error('Java runtime is required for government feed XSD validation.')
      }

      const message = [error?.stdout, error?.stderr]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .join('\n')
        .trim()

      throw new Error(
        `Generated feed failed XSD validation against "${path.basename(xsdPath)}".${message ? `\n${message}` : ''}`,
      )
    }

    return { validated: true, validator: 'java' }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

function validateMaxLength(value, maxLength, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} is required.`)
  }

  if (value.length > maxLength) {
    throw new Error(`${label} exceeds max length ${maxLength}.`)
  }
}

export function validateFeedXml(feedXml) {
  if (!feedXml.includes(`<ns2:datasets xmlns:ns2="${GOVERNMENT_NAMESPACE}"`)) {
    throw new Error(`Generated XML must use namespace ${GOVERNMENT_NAMESPACE}.`)
  }

  if (!feedXml.includes('<dataset status="published">')) {
    throw new Error('Generated XML must contain published datasets.')
  }

  if (!feedXml.includes('<resource status="published">')) {
    throw new Error('Generated XML must contain published resources.')
  }
}

function validateExtIdent(value, label) {
  if (!/^[A-Za-z0-9]{1,36}$/.test(value)) {
    throw new Error(`${label} extIdent "${value}" must be 1-36 ASCII alphanumeric characters.`)
  }
}

function normalizeAddress(address) {
  return {
    voivodeship: address.voivodeship.trim(),
    county: address.county.trim(),
    municipality: address.municipality.trim(),
    city: address.city.trim(),
    street: address.street.trim(),
    buildingNumber: address.buildingNumber.trim(),
    unitNumber: normalizeCsvCell(address.unitNumber),
    postalCode: address.postalCode.trim(),
  }
}

function validateAddress(errors, pathLabel, address) {
  for (const field of ['voivodeship', 'county', 'municipality', 'city', 'street', 'buildingNumber', 'postalCode']) {
    validateRequiredString(errors, `${pathLabel}.${field}`, address?.[field])
  }
}

function validateRequiredString(errors, pathLabel, value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${pathLabel} is required.`)
  }
}

function validateTextLength(errors, pathLabel, value, maxLength) {
  if (typeof value === 'string' && value.length > maxLength) {
    errors.push(`${pathLabel} exceeds max length ${maxLength}.`)
  }
}

function validatePositiveNumber(errors, pathLabel, value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${pathLabel} must be a positive number.`)
  }
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeOptionalExtIdent(value) {
  const normalized = normalizeOptionalString(value)
  if (!normalized) {
    return undefined
  }

  const sanitized = sanitizeExtIdent(normalized)
  return sanitized.length > 0 ? sanitized.slice(0, 36) : undefined
}

function normalizeCsvCell(value) {
  if (typeof value !== 'string') {
    return 'X'
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : 'X'
}

// E1 allows only "lokal mieszkalny" or "dom jednorodzinny"; a terraced house is a dom jednorodzinny.
const CSV_PROPERTY_TYPES = {
  'lokal mieszkalny': 'lokal mieszkalny',
  'dom jednorodzinny': 'dom jednorodzinny',
  'dom w zabudowie szeregowej': 'dom jednorodzinny',
}

// Rough bounding box of Poland, to catch missing or swapped coordinates before they are published.
const POLAND_BOUNDS = { minLatitude: 49, maxLatitude: 55, minLongitude: 14, maxLongitude: 24.2 }

function normalizeCoordinates(investment, label, errors) {
  const { latitude, longitude } = investment ?? {}
  const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

  if (!isNumber(latitude) || !isNumber(longitude)) {
    errors.push(`${label}.latitude and ${label}.longitude are required (WGS-84, D8/D9 of Dz.U. 2026 poz. 1489).`)
    return undefined
  }

  if (
    latitude < POLAND_BOUNDS.minLatitude ||
    latitude > POLAND_BOUNDS.maxLatitude ||
    longitude < POLAND_BOUNDS.minLongitude ||
    longitude > POLAND_BOUNDS.maxLongitude
  ) {
    errors.push(
      `${label} coordinates (latitude ${latitude}, longitude ${longitude}) are outside Poland. Check whether they are swapped.`,
    )
    return undefined
  }

  return { latitude, longitude }
}

function normalizeNip(value) {
  return typeof value === 'string' ? value.replace(/[\s-]/g, '') : ''
}

function formatAmount(value) {
  return value.toFixed(2)
}

function formatCoordinate(value) {
  return value.toFixed(6)
}

// Price validity is a calendar date in the CMS; the regulation requires RRRR-MM-DD GG:MM:SS.
function formatDateTime(isoDate) {
  return `${isoDate} 00:00:00`
}

function sanitizeSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeExtIdent(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('https://')) {
    throw new Error('Government export requires an https base URL. Set GOVERNMENT_EXPORT_BASE_URL if client.domain is not correct.')
  }

  return value.replace(/\/+$/, '')
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')
  if (!/[;"\r\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replaceAll('"', '""')}"`
}

function escapeXml(value) {
  // Quotes stay literal in element text so registered names like "EVENEMENT ..." render as registered.
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function unescapeXml(value) {
  if (value == null) {
    return value
  }

  let decoded = String(value)
  // Collapse nested &amp; from older buggy regenerations before decoding other entities.
  for (let i = 0; i < 16 && decoded.includes('&amp;'); i += 1) {
    decoded = decoded.replaceAll('&amp;', '&')
  }

  return decoded
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}

function extractXmlTag(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`))
  return match?.[1]?.trim()
}

function extractSecondXmlTag(xml, tagName) {
  const matches = [...xml.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g'))]
  return matches[1]?.[1]?.trim()
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

function hasBasehubCredentials(env) {
  return Boolean(env.BASEHUB_URL || (env.BASEHUB_TEAM && env.BASEHUB_REPO))
}

function getInvestmentList(investments) {
  if (Array.isArray(investments)) {
    return investments
  }

  if (Array.isArray(investments?.items)) {
    return investments.items
  }

  return []
}

function getBasehubConfig(env) {
  const token = env.BASEHUB_TOKEN
  const url = env.BASEHUB_URL
  const team = env.BASEHUB_TEAM
  const repo = env.BASEHUB_REPO
  const ref = env.BASEHUB_REF

  if (url) {
    return token ? { token, url, ref } : { url, ref }
  }

  if (team && repo) {
    return token ? { token, team, repo, ref } : { team, repo, ref }
  }

  return token ? { token, ref } : ref ? { ref } : {}
}

function getWarsawDateString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

const BASEHUB_VALID_FROM_RE = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}
