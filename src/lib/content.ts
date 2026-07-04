import { basehub } from 'basehub';
import type { BasehubRichTextDocument } from './basehub-rich-text';

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

interface CmsAboutPage {
  metaDescription: string;
  storyEyebrow: string;
  storyHeading: string;
  storyContent: BasehubRichTextDocument | null;
  storyImage?: CmsAsset | null;
}

interface CmsAddress {
  city: string;
  street: string;
  buildingNumber: string;
  unitNumber?: string | null;
  postalCode: string;
}

interface CmsDeveloperContact {
  name: string;
  phone: string;
  email: string;
  legalForm?: string | null;
  nip?: string | null;
  regon?: string | null;
  registeredAddress: CmsAddress;
}

interface CmsPriceHistoryEntry {
  validFrom: string;
  pricePerM2: number;
  baseTotalPrice: number;
}

interface CmsUnit {
  unitNumber: string;
  slug: string;
  propertyType: PropertyType;
  status: UnitStatus;
  usableAreaM2: number;
  plotAreaM2: number;
  rooms: number;
  description: string;
  gallery: CmsGalleryItem[];
  priceHistory: CmsPriceHistoryEntry[];
}

interface CmsInvestment {
  name: string;
  slug: string;
  summary: string;
  description: BasehubRichTextDocument | null;
  locationAddress: string;
  prospectusFile?: CmsAsset | null;
  salesStatus: SalesStatus;
  gallery: CmsGalleryItem[];
  units: CmsUnit[];
}

interface SiteContent {
  investments: CmsInvestment[];
  developer: CmsDeveloperContact;
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
  description: BasehubRichTextDocument | null;
  locationAddress: string;
  prospectusUrl?: string;
  salesStatus: SalesStatus;
  gallery: string[];
  coverImage?: string;
  units: Unit[];
}

export interface HomepageContent {
  homepageGallery: string[];
}

export interface AboutPageContent {
  metaDescription: string;
  storyEyebrow: string;
  storyHeading: string;
  storyContent: BasehubRichTextDocument | null;
  storyImage?: CmsAsset;
}

export interface DeveloperContact {
  name: string;
  phone: string;
  phoneFormatted: string;
  phoneHref: string;
  email: string;
  legalForm?: string;
  nip?: string;
  nipFormatted?: string;
  regon?: string;
  registeredAddress: {
    lineOne: string;
    lineTwo?: string;
  };
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
    developer: {
      name: true,
      phone: true,
      email: true,
      legalForm: true,
      nip: true,
      regon: true,
      registeredAddress: {
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
        summary: true,
        description: {
          json: {
            content: true,
          },
        },
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
                pricePerM2: true,
                baseTotalPrice: true,
              },
            },
          },
        },
      },
    },
  },
} as const;

const ABOUT_PAGE_QUERY = {
  content: {
    aboutPage: {
      metaDescription: true,
      storyEyebrow: true,
      storyHeading: true,
      storyContent: {
        json: {
          content: true,
        },
      },
      storyImage: {
        url: true,
        alt: true,
      },
    },
  },
} as const;

const DEFAULT_ABOUT_PAGE_CONTENT: AboutPageContent = {
  metaDescription: 'Dowiedz się więcej o firmie EVENEMENT — naszej historii, wartościach i zespole.',
  storyEyebrow: 'Nasza Historia',
  storyHeading: 'Zbudowane na zaufaniu i najwyższej jakości',
  storyContent: {
    json: {
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Zaczynaliśmy jako niewielka firma rodzinna, a dziś jesteśmy zaufanym deweloperem realizującym nowoczesne inwestycje mieszkaniowe. Od ponad 15 lat tworzymy przemyślane nieruchomości z dbałością o każdy detal — z myślą o kolejnych pokoleniach.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Nasze projekty łączą nowoczesną architekturę, funkcjonalne układy oraz ekologiczne rozwiązania. Dbamy o to, aby każdy etap budowy przebiegał zgodnie z najwyższymi standardami, gwarantując naszym klientom bezpieczeństwo i spokój na lata.',
            },
          ],
        },
      ],
    },
  },
  storyImage: {
    url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
  },
};

let investmentsPromise: Promise<Investment[]> | undefined;
let homepageContentPromise: Promise<HomepageContent> | undefined;
let aboutPageContentPromise: Promise<AboutPageContent> | undefined;
let developerContactPromise: Promise<DeveloperContact> | undefined;
let siteContentPromise: Promise<(SiteContent & CmsHomepageContent & { _sourceLabel: string })> | undefined;

export async function getInvestments(): Promise<Investment[]> {
  investmentsPromise ??= loadInvestments();
  return investmentsPromise;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  homepageContentPromise ??= loadHomepageContent();
  return homepageContentPromise;
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  aboutPageContentPromise ??= loadAboutPageContent();
  return aboutPageContentPromise;
}

export async function getDeveloperContact(): Promise<DeveloperContact> {
  developerContactPromise ??= loadDeveloperContact();
  return developerContactPromise;
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
  const content = await getSiteContent();
  return normalizeAndValidate(content, content._sourceLabel);
}

async function loadHomepageContent(): Promise<HomepageContent> {
  const content = await getSiteContent();

  return {
    homepageGallery: normalizeHomepageImages(content),
  };
}

async function loadAboutPageContent(): Promise<AboutPageContent> {
  if (!hasBasehubCredentials()) {
    return DEFAULT_ABOUT_PAGE_CONTENT;
  }

  try {
    const data = await basehub(getBasehubConfig()).query(ABOUT_PAGE_QUERY as any);
    return normalizeAboutPageContent(data.content.aboutPage);
  } catch (error) {
    warnLog('Falling back to default about page content', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return DEFAULT_ABOUT_PAGE_CONTENT;
  }
}

function normalizeAboutPageContent(aboutPage: CmsAboutPage): AboutPageContent {
  const storyImage = aboutPage.storyImage?.url
    ? { url: aboutPage.storyImage.url, alt: aboutPage.storyImage.alt }
    : DEFAULT_ABOUT_PAGE_CONTENT.storyImage;

  return {
    metaDescription: aboutPage.metaDescription,
    storyEyebrow: aboutPage.storyEyebrow,
    storyHeading: aboutPage.storyHeading,
    storyContent: aboutPage.storyContent,
    storyImage,
  };
}

async function loadDeveloperContact(): Promise<DeveloperContact> {
  const content = await getSiteContent();
  const developer = content.developer;
  const phone = developer.phone.trim();
  const nip = developer.nip?.trim();

  return {
    name: developer.name,
    phone,
    phoneFormatted: formatPhoneDisplay(phone),
    phoneHref: normalizePhoneHref(phone),
    email: developer.email,
    legalForm: developer.legalForm?.trim() || undefined,
    nip: nip || undefined,
    nipFormatted: nip ? formatNipDisplay(nip) : undefined,
    regon: developer.regon?.trim() || undefined,
    registeredAddress: formatAddress(developer.registeredAddress),
  };
}

async function getSiteContent(): Promise<SiteContent & CmsHomepageContent & { _sourceLabel: string }> {
  siteContentPromise ??= loadSiteContent();
  return siteContentPromise;
}

async function loadSiteContent(): Promise<SiteContent & CmsHomepageContent & { _sourceLabel: string }> {
  if (!hasBasehubCredentials()) {
    throw new Error(
      'BaseHub content is required, but no BaseHub credentials were found. Set BASEHUB_URL or BASEHUB_TEAM and BASEHUB_REPO, plus BASEHUB_TOKEN if needed.',
    );
  }

  debugLog('Loading BaseHub content', {
    hasBasehubCredentials: true,
  });

  return { ...(await loadBasehubContent()), _sourceLabel: 'BaseHub' };
}

function hasBasehubCredentials(): boolean {
  return Boolean(
    import.meta.env.BASEHUB_URL ||
      (import.meta.env.BASEHUB_TEAM && import.meta.env.BASEHUB_REPO),
  );
}

async function loadBasehubContent(): Promise<SiteContent & CmsHomepageContent> {
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
    developer: {
      name: data.content.developer.name,
      phone: data.content.developer.phone,
      email: data.content.developer.email,
      legalForm: data.content.developer.legalForm,
      nip: data.content.developer.nip,
      regon: data.content.developer.regon,
      registeredAddress: {
        city: data.content.developer.registeredAddress.city,
        street: data.content.developer.registeredAddress.street,
        buildingNumber: data.content.developer.registeredAddress.buildingNumber,
        unitNumber: data.content.developer.registeredAddress.unitNumber,
        postalCode: data.content.developer.registeredAddress.postalCode,
      },
    },
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
        description: unit.description,
        gallery: unit.gallery.items.map((item) => ({
          image: {
            url: item.image.url,
            alt: item.image.alt,
          },
        })),
        priceHistory: unit.priceHistory.items.map((entry) => ({
          validFrom: entry.validFrom,
          pricePerM2: entry.pricePerM2,
          baseTotalPrice: entry.baseTotalPrice,
        })),
      })),
    })),
  };
}

function formatAddress(address: CmsAddress): DeveloperContact['registeredAddress'] {
  const lineOne = [address.street, address.buildingNumber].filter(Boolean).join(' ');
  const lineTwo = [address.postalCode, address.city].filter(Boolean).join(' ');
  const unitNumber = address.unitNumber?.trim();

  return {
    lineOne: unitNumber ? `${lineOne}/${unitNumber}` : lineOne,
    lineTwo: lineTwo || undefined,
  };
}

function normalizePhoneHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized.startsWith('+') ? normalized : `+48${normalized}`;
}

export function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  const normalized = trimmed.replace(/[^\d+]/g, '');
  const digits = normalized.replace(/\D/g, '');

  if (digits.length === 9) {
    return `+48 ${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
  }

  if (digits.startsWith('48') && digits.length === 11) {
    const subscriber = digits.slice(2).replace(/(\d{3})(?=\d)/g, '$1 ');
    return `+48 ${subscriber}`;
  }

  return trimmed;
}

function formatNipDisplay(nip: string): string {
  const digits = nip.replace(/\D/g, '');

  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}

function getBasehubConfig() {
  const token = import.meta.env.BASEHUB_TOKEN;
  const url = import.meta.env.BASEHUB_URL;
  const team = import.meta.env.BASEHUB_TEAM;
  const repo = import.meta.env.BASEHUB_REPO;
  const ref = import.meta.env.BASEHUB_REF;

  if (url) {
    return token ? { token, url, ref } : { url, ref };
  }

  if (team && repo) {
    return token ? { token, team, repo, ref } : { team, repo, ref };
  }

  return token ? { token, ref } : ref ? { ref } : {};
}

function normalizeAndValidate(content: SiteContent, label: string): Investment[] {
  const errors: string[] = [];
  const seenInvestmentSlugs = new Set<string>();

  const investments = content.investments.map((investment, investmentIndex) => {
    const investmentPath = `investments[${investmentIndex}]`;
    validateRequiredString(errors, `${investmentPath}.name`, investment.name);
    validateRequiredString(errors, `${investmentPath}.slug`, investment.slug);
    validateRequiredString(errors, `${investmentPath}.summary`, investment.summary);
    validateRichTextDocument(errors, `${investmentPath}.description`, investment.description);
    validateRequiredString(errors, `${investmentPath}.locationAddress`, investment.locationAddress);

    if (!isSalesStatus(investment.salesStatus)) {
      errors.push(`${investmentPath}.salesStatus must be "active" or "ended".`);
    }

    if (seenInvestmentSlugs.has(investment.slug)) {
      errors.push(`${investmentPath}.slug must be unique.`);
    }
    seenInvestmentSlugs.add(investment.slug);

    const gallery = normalizeGallery(investment.gallery, `${investmentPath}.gallery`, errors, false);
    if (gallery.length === 0) {
      warnLog('Investment is missing gallery images', {
        source: label,
        investmentSlug: investment.slug,
        investmentName: investment.name,
        path: `${investmentPath}.gallery`,
      });
    }
    const seenUnitSlugs = new Set<string>();

    const units = investment.units.map((unit, unitIndex) => {
      const unitPath = `${investmentPath}.units[${unitIndex}]`;
      validateRequiredString(errors, `${unitPath}.unitNumber`, unit.unitNumber);
      validateRequiredString(errors, `${unitPath}.slug`, unit.slug);
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
      if (unitGallery.length === 0) {
        warnLog('Unit is missing gallery images', {
          source: label,
          investmentSlug: investment.slug,
          unitSlug: unit.slug,
          unitNumber: unit.unitNumber,
          path: `${unitPath}.gallery`,
        });
      }
      const priceHistory = unit.priceHistory
        .map((entry, entryIndex) => {
          const entryPath = `${unitPath}.priceHistory[${entryIndex}]`;
          validateRequiredString(errors, `${entryPath}.validFrom`, entry.validFrom);
          validatePositiveNumber(errors, `${entryPath}.pricePerM2`, entry.pricePerM2);
          validatePositiveNumber(errors, `${entryPath}.baseTotalPrice`, entry.baseTotalPrice);

          if (Number.isNaN(Date.parse(entry.validFrom))) {
            errors.push(`${entryPath}.validFrom must be a valid date.`);
          }

          return {
            validFrom: entry.validFrom,
            totalPrice: entry.baseTotalPrice,
            pricePerM2: entry.pricePerM2,
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
        description: unit.description,
        gallery: unitGallery,
        coverImage: unitGallery[0],
        currentPrice: priceHistory[0]!,
        priceHistory,
      };
    });

    return {
      name: investment.name,
      slug: investment.slug,
      summary: investment.summary,
      description: investment.description,
      locationAddress: investment.locationAddress,
      prospectusUrl: investment.prospectusFile?.url || undefined,
      salesStatus: investment.salesStatus,
      gallery,
      coverImage: gallery[0],
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
      const rawUrl = item?.image?.url;
      validateRequiredString(errors, entryPath, rawUrl);
      return typeof rawUrl === 'string' ? rawUrl.trim() : '';
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

function validateRichTextDocument(errors: string[], path: string, value: BasehubRichTextDocument | null) {
  if (!Array.isArray(value?.json?.content) || value.json.content.length === 0) {
    errors.push(`${path} must contain rich text content.`);
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

function warnLog(message: string, details?: Record<string, unknown>) {
  console.warn('[content]', message, details ?? {});
}
