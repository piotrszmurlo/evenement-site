import { basehub } from 'basehub';

type ContentSource = 'auto' | 'basehub' | 'fixture';
type SalesStatus = 'active' | 'ended';
type UnitStatus = 'available' | 'reserved' | 'sold';
type PropertyType = 'dom jednorodzinny' | 'dom w zabudowie szeregowej' | 'lokal mieszkalny';

interface CmsAsset {
  url: string;
  alt?: string | null;
}

interface CmsGalleryItem {
  image: CmsAsset;
}

interface CmsHomepageContent {
  homepageImage1?: CmsAsset | null;
  homepageImage2?: CmsAsset | null;
  homepageImage3?: CmsAsset | null;
  homepageImage4?: CmsAsset | null;
  homepageImage5?: CmsAsset | null;
}

interface CmsPriceHistoryEntry {
  validFrom: string;
  totalPrice: number;
}

interface CmsUnit {
  unitNumber: string;
  slug: string;
  propertyType: PropertyType;
  status: UnitStatus;
  usableAreaM2: number;
  plotAreaM2: number;
  rooms: number;
  shortDescription: string;
  description: string;
  gallery: CmsGalleryItem[];
  priceHistory: CmsPriceHistoryEntry[];
}

interface CmsInvestment {
  name: string;
  slug: string;
  summary: string;
  description: string;
  locationAddress: string;
  prospectusFile?: CmsAsset | null;
  salesStatus: SalesStatus;
  gallery: CmsGalleryItem[];
  units: CmsUnit[];
}

interface FixtureContent {
  investments: CmsInvestment[];
}

export interface PriceHistoryEntry {
  validFrom: string;
  totalPrice: number;
  pricePerM2: number;
}

export interface Unit {
  unitNumber: string;
  slug: string;
  propertyType: PropertyType;
  status: UnitStatus;
  usableAreaM2: number;
  plotAreaM2: number;
  rooms: number;
  shortDescription: string;
  description: string;
  gallery: string[];
  coverImage?: string;
  currentPrice: PriceHistoryEntry;
  priceHistory: PriceHistoryEntry[];
}

export interface Investment {
  name: string;
  slug: string;
  summary: string;
  description: string;
  locationAddress: string;
  prospectusUrl?: string;
  salesStatus: SalesStatus;
  gallery: string[];
  coverImage: string;
  units: Unit[];
}

export interface HomepageContent {
  homepageGallery: string[];
}

const SITE_CONTENT_QUERY = {
  content: {
    homepageImage1: {
      url: true,
      alt: true,
    },
    homepageImage2: {
      url: true,
      alt: true,
    },
    homepageImage3: {
      url: true,
      alt: true,
    },
    homepageImage4: {
      url: true,
      alt: true,
    },
    homepageImage5: {
      url: true,
      alt: true,
    },
    investments: {
      items: {
        name: true,
        slug: true,
        summary: true,
        description: true,
        locationAddress: true,
        prospectusFile: {
          url: true,
        },
        salesStatus: true,
        gallery: {
          items: {
            image: {
              url: true,
              alt: true,
            },
          },
        },
        units: {
          items: {
            unitNumber: true,
            slug: true,
            propertyType: true,
            status: true,
            usableAreaM2: true,
            plotAreaM2: true,
            rooms: true,
            shortDescription: true,
            description: true,
            gallery: {
              items: {
                image: {
                  url: true,
                  alt: true,
                },
              },
            },
            priceHistory: {
              items: {
                validFrom: true,
                totalPrice: true,
              },
            },
          },
        },
      },
    },
  },
} as const;

let investmentsPromise: Promise<Investment[]> | undefined;
let homepageContentPromise: Promise<HomepageContent> | undefined;

export async function getInvestments(): Promise<Investment[]> {
  investmentsPromise ??= loadInvestments();
  return investmentsPromise;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  homepageContentPromise ??= loadHomepageContent();
  return homepageContentPromise;
}

export async function getInvestmentBySlug(slug: string): Promise<Investment | undefined> {
  const investments = await getInvestments();
  return investments.find((investment) => investment.slug === slug);
}

export async function getUnitBySlug(investmentSlug: string, unitSlug: string) {
  const investment = await getInvestmentBySlug(investmentSlug);
  if (!investment) return undefined;

  const unit = investment.units.find((entry) => entry.slug === unitSlug);
  if (!unit) return undefined;

  return {
    investment,
    unit,
  };
}

export function formatPropertyTypeLabel(propertyType: PropertyType): string {
  if (propertyType === 'lokal mieszkalny') {
    return 'nieruchomość mieszkalna';
  }

  return propertyType;
}

async function loadInvestments(): Promise<Investment[]> {
  const content = await loadSiteContent();
  return normalizeAndValidate(content, content._sourceLabel);
}

async function loadHomepageContent(): Promise<HomepageContent> {
  const content = await loadSiteContent();

  return {
    homepageGallery: normalizeHomepageImages(content),
  };
}

async function loadSiteContent(): Promise<FixtureContent & CmsHomepageContent & { _sourceLabel: string }> {
  const source = resolveContentSource();
  debugLog('Resolved content source', {
    source,
    hasBasehubCredentials: hasBasehubCredentials(),
  });

  if (source === 'fixture') {
    debugLog('Loading fixture content because CONTENT_SOURCE=fixture');
    return { ...(await loadFixtureContent()), _sourceLabel: 'fixture' };
  }

  if (source === 'basehub') {
    debugLog('Loading BaseHub content because CONTENT_SOURCE=basehub');
    return { ...(await loadBasehubContent()), _sourceLabel: 'BaseHub' };
  }

  try {
    if (hasBasehubCredentials()) {
      debugLog('Loading BaseHub content in auto mode');
      return { ...(await loadBasehubContent()), _sourceLabel: 'BaseHub' };
    }
  } catch (error) {
    debugLog('BaseHub load failed in auto mode, falling back to fixture', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (import.meta.env.PROD) {
      throw error;
    }
  }

  debugLog('Falling back to fixture content');
  return { ...(await loadFixtureContent()), _sourceLabel: 'fixture' };
}

function resolveContentSource(): ContentSource {
  const value = import.meta.env.CONTENT_SOURCE;
  if (value === 'basehub' || value === 'fixture' || value === 'auto') {
    return value;
  }

  if (import.meta.env.PROD) {
    return 'basehub';
  }

  return 'auto';
}

function hasBasehubCredentials(): boolean {
  return Boolean(
    import.meta.env.BASEHUB_URL ||
      import.meta.env.BASEHUB_TOKEN ||
      (import.meta.env.BASEHUB_TEAM && import.meta.env.BASEHUB_REPO),
  );
}

async function loadFixtureContent(): Promise<FixtureContent> {
  const module = await import('../../fixtures/sample-content.json');
  debugLog('Fixture content loaded', {
    investmentCount: module.default?.investments?.length ?? 0,
  });
  return module.default;
}

async function loadBasehubContent(): Promise<FixtureContent & CmsHomepageContent> {
  const config = getBasehubConfig();
  debugLog('Querying BaseHub', {
    hasToken: Boolean(config.token),
    hasUrl: 'url' in config && Boolean(config.url),
    hasTeam: 'team' in config && Boolean(config.team),
    hasRepo: 'repo' in config && Boolean(config.repo),
  });

  const data = await basehub(config).query(SITE_CONTENT_QUERY as any);
  const investments = data.content?.investments?.items ?? [];

  debugLog('BaseHub response received', {
    investmentCount: investments.length,
    investmentSlugs: investments.map((investment) => investment.slug),
  });

  return {
    homepageImage1: data.content?.homepageImage1?.url
      ? { url: data.content.homepageImage1.url, alt: data.content.homepageImage1.alt }
      : null,
    homepageImage2: data.content?.homepageImage2?.url
      ? { url: data.content.homepageImage2.url, alt: data.content.homepageImage2.alt }
      : null,
    homepageImage3: data.content?.homepageImage3?.url
      ? { url: data.content.homepageImage3.url, alt: data.content.homepageImage3.alt }
      : null,
    homepageImage4: data.content?.homepageImage4?.url
      ? { url: data.content.homepageImage4.url, alt: data.content.homepageImage4.alt }
      : null,
    homepageImage5: data.content?.homepageImage5?.url
      ? { url: data.content.homepageImage5.url, alt: data.content.homepageImage5.alt }
      : null,
    investments: investments.map((investment) => ({
      name: investment.name,
      slug: investment.slug,
      summary: investment.summary,
      description: investment.description,
      locationAddress: investment.locationAddress,
      prospectusFile: investment.prospectusFile?.url
        ? { url: investment.prospectusFile.url }
        : null,
      salesStatus: investment.salesStatus,
      gallery: investment.gallery.items.map((item) => ({
        image: {
          url: item.image.url,
          alt: item.image.alt,
        },
      })),
      units: investment.units.items.map((unit) => ({
        unitNumber: unit.unitNumber,
        slug: unit.slug,
        propertyType: unit.propertyType,
        status: unit.status,
        usableAreaM2: unit.usableAreaM2,
        plotAreaM2: unit.plotAreaM2,
        rooms: unit.rooms,
        shortDescription: unit.shortDescription,
        description: unit.description,
        gallery: unit.gallery.items.map((item) => ({
          image: {
            url: item.image.url,
            alt: item.image.alt,
          },
        })),
        priceHistory: unit.priceHistory.items.map((entry) => ({
          validFrom: entry.validFrom,
          totalPrice: entry.totalPrice,
        })),
      })),
    })),
  };
}

function getBasehubConfig() {
  const token = import.meta.env.BASEHUB_TOKEN;
  const url = import.meta.env.BASEHUB_URL;
  const team = import.meta.env.BASEHUB_TEAM;
  const repo = import.meta.env.BASEHUB_REPO;

  if (url) {
    return token ? { token, url } : { url };
  }

  if (team && repo) {
    return token ? { token, team, repo } : { team, repo };
  }

  return token ? { token } : {};
}

function normalizeAndValidate(content: FixtureContent, label: string): Investment[] {
  const errors: string[] = [];
  const seenInvestmentSlugs = new Set<string>();

  const investments = content.investments.map((investment, investmentIndex) => {
    const investmentPath = `investments[${investmentIndex}]`;
    validateRequiredString(errors, `${investmentPath}.name`, investment.name);
    validateRequiredString(errors, `${investmentPath}.slug`, investment.slug);
    validateRequiredString(errors, `${investmentPath}.summary`, investment.summary);
    validateRequiredString(errors, `${investmentPath}.description`, investment.description);
    validateRequiredString(errors, `${investmentPath}.locationAddress`, investment.locationAddress);

    if (!isSalesStatus(investment.salesStatus)) {
      errors.push(`${investmentPath}.salesStatus must be "active" or "ended".`);
    }

    if (seenInvestmentSlugs.has(investment.slug)) {
      errors.push(`${investmentPath}.slug must be unique.`);
    }
    seenInvestmentSlugs.add(investment.slug);

    const gallery = normalizeGallery(investment.gallery, `${investmentPath}.gallery`, errors);
    const seenUnitSlugs = new Set<string>();

    const units = investment.units.map((unit, unitIndex) => {
      const unitPath = `${investmentPath}.units[${unitIndex}]`;
      validateRequiredString(errors, `${unitPath}.unitNumber`, unit.unitNumber);
      validateRequiredString(errors, `${unitPath}.slug`, unit.slug);
      validateRequiredString(errors, `${unitPath}.shortDescription`, unit.shortDescription);
      validateRequiredString(errors, `${unitPath}.description`, unit.description);

      if (!isPropertyType(unit.propertyType)) {
        errors.push(`${unitPath}.propertyType is invalid.`);
      }

      if (!isUnitStatus(unit.status)) {
        errors.push(`${unitPath}.status is invalid.`);
      }

      validatePositiveNumber(errors, `${unitPath}.usableAreaM2`, unit.usableAreaM2);
      validatePositiveNumber(errors, `${unitPath}.plotAreaM2`, unit.plotAreaM2);
      validatePositiveNumber(errors, `${unitPath}.rooms`, unit.rooms);

      if (seenUnitSlugs.has(unit.slug)) {
        errors.push(`${unitPath}.slug must be unique within an investment.`);
      }
      seenUnitSlugs.add(unit.slug);

      const unitGallery = normalizeGallery(
        unit.gallery,
        `${unitPath}.gallery`,
        errors,
        false,
      );
      const priceHistory = unit.priceHistory
        .map((entry, entryIndex) => {
          const entryPath = `${unitPath}.priceHistory[${entryIndex}]`;
          validateRequiredString(errors, `${entryPath}.validFrom`, entry.validFrom);
          validatePositiveNumber(errors, `${entryPath}.totalPrice`, entry.totalPrice);

          if (Number.isNaN(Date.parse(entry.validFrom))) {
            errors.push(`${entryPath}.validFrom must be a valid date.`);
          }

          return {
            validFrom: entry.validFrom,
            totalPrice: entry.totalPrice,
            pricePerM2: Math.round((entry.totalPrice / unit.usableAreaM2) * 100) / 100,
          };
        })
        .sort((left, right) => Date.parse(right.validFrom) - Date.parse(left.validFrom));

      if (priceHistory.length === 0) {
        errors.push(`${unitPath}.priceHistory must contain at least one entry.`);
      }

      return {
        unitNumber: unit.unitNumber,
        slug: unit.slug,
        propertyType: unit.propertyType,
        status: unit.status,
        usableAreaM2: unit.usableAreaM2,
        plotAreaM2: unit.plotAreaM2,
        rooms: unit.rooms,
        shortDescription: unit.shortDescription,
        description: unit.description,
        gallery: unitGallery,
        coverImage: unitGallery[0],
        currentPrice: priceHistory[0]!,
        priceHistory,
      };
    });

    if (units.length === 0) {
      errors.push(`${investmentPath}.units must contain at least one unit.`);
    }

    return {
      name: investment.name,
      slug: investment.slug,
      summary: investment.summary,
      description: investment.description,
      locationAddress: investment.locationAddress,
      prospectusUrl: investment.prospectusFile?.url || undefined,
      salesStatus: investment.salesStatus,
      gallery,
      coverImage: gallery[0] ?? '',
      units,
    };
  });

  if (errors.length > 0) {
    throw new Error(`Invalid ${label} content:\n- ${errors.join('\n- ')}`);
  }

  return investments;
}

function normalizeGallery(
  gallery: CmsGalleryItem[],
  path: string,
  errors: string[],
  requireAtLeastOneImage = true,
) {
  const urls = gallery
    .map((item, index) => {
      const entryPath = `${path}[${index}].image.url`;
      validateRequiredString(errors, entryPath, item?.image?.url);
      return item?.image?.url ?? '';
    })
    .filter(Boolean);

  if (requireAtLeastOneImage && urls.length === 0) {
    errors.push(`${path} must contain at least one image.`);
  }

  return urls;
}

function normalizeHomepageImages(content: CmsHomepageContent) {
  return [
    content.homepageImage1?.url,
    content.homepageImage2?.url,
    content.homepageImage3?.url,
    content.homepageImage4?.url,
    content.homepageImage5?.url,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function validateRequiredString(errors: string[], path: string, value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${path} is required.`);
  }
}

function validatePositiveNumber(errors: string[], path: string, value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${path} must be a positive number.`);
  }
}

function isSalesStatus(value: string): value is SalesStatus {
  return value === 'active' || value === 'ended';
}

function isUnitStatus(value: string): value is UnitStatus {
  return value === 'available' || value === 'reserved' || value === 'sold';
}

function isPropertyType(value: string): value is PropertyType {
  return (
    value === 'dom jednorodzinny' ||
    value === 'dom w zabudowie szeregowej' ||
    value === 'lokal mieszkalny'
  );
}

function debugLog(message: string, details?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    return;
  }

  console.log('[content]', message, details ?? {});
}
