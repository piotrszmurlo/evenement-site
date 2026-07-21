import { brand } from '../config/brand';
import type { Investment } from './content';

const MENTIONS_BIALYSTOK = /bia[łl]ystok/i;
const MENTIONS_KRUPNIKI = /krupnik/i;

/** Document title / og:title — keeps H1 as clean CMS `name`. */
export function investmentSeoTitle(investment: Investment): string {
  const locationCue = locationSeoCue(investment);
  return locationCue
    ? `${investment.name} — ${locationCue} | ${brand.name}`
    : `${investment.name} | ${brand.name}`;
}

/**
 * Meta description. Prefers CMS `summary` when it already mentions Białystok;
 * otherwise appends a short location cue so ranking works before the CMS edit.
 */
export function investmentSeoDescription(investment: Investment): string {
  const summary = investment.summary.trim();
  if (MENTIONS_BIALYSTOK.test(summary)) return summary;

  const location = investment.locationAddress.trim();
  if (MENTIONS_BIALYSTOK.test(location)) {
    return summary
      ? `${ensureSentence(summary)} Lokalizacja: ${location}.`
      : `${investment.name} — ${location}.`;
  }

  const cue = metaLocationCue(investment);
  if (!cue) return summary || investment.name;
  if (!summary) return `${investment.name}. ${cue}`;
  return `${ensureSentence(summary)} ${cue}`;
}

export function investmentImageAlt(investment: Investment, detail?: string): string {
  const cue = locationSeoCue(investment);
  const base = cue ? `${investment.name} — ${cue.toLowerCase()}` : investment.name;
  return detail ? `${base}, ${detail}` : base;
}

export function buildInvestmentJsonLd(
  investment: Investment,
  pageUrl: string,
  siteUrl: string,
): Record<string, unknown>[] {
  const description = investmentSeoDescription(investment);
  const images = [
    investment.coverImage,
    ...investment.gallery.filter((url) => url !== investment.coverImage),
  ].filter((url): url is string => Boolean(url));

  const inKrupniki = MENTIONS_KRUPNIKI.test(investment.locationAddress);
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    streetAddress: investment.locationAddress,
    addressCountry: 'PL',
  };
  if (inKrupniki) {
    address.addressLocality = 'Krupniki';
    address.addressRegion = 'podlaskie';
  }

  const residence: Record<string, unknown> = {
    '@type': 'ApartmentComplex',
    '@id': `${pageUrl}#residence`,
    name: investment.name,
    description,
    url: pageUrl,
    address,
  };

  if (inKrupniki || MENTIONS_BIALYSTOK.test(investment.locationAddress + investment.summary)) {
    residence.areaServed = [
      ...(inKrupniki ? [{ '@type': 'Place', name: 'Krupniki' }] : []),
      { '@type': 'City', name: 'Białystok' },
    ];
  }

  if (images.length > 0) {
    residence.image = images;
  }

  const breadcrumb: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Strona główna',
        item: siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Inwestycje',
        item: new URL('/inwestycje/', siteUrl).href,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: investment.name,
        item: pageUrl,
      },
    ],
  };

  return [residence, breadcrumb];
}

/** Visible map blurb — only when CMS location points at Krupniki. */
export function investmentLocationIntro(investment: Investment): string {
  if (MENTIONS_KRUPNIKI.test(investment.locationAddress)) {
    return `${investment.name} w Krupnikach koło Białegostoku — tereny zielone i spokojne sąsiedztwo.`;
  }
  return 'Okolica inwestycji — tereny zielone i spokojne sąsiedztwo.';
}

function locationSeoCue(investment: Investment): string | null {
  if (MENTIONS_KRUPNIKI.test(investment.locationAddress)) {
    return 'Domy w Krupnikach koło Białegostoku';
  }
  if (MENTIONS_BIALYSTOK.test(investment.locationAddress)) {
    return 'Domy w okolicy Białegostoku';
  }
  return null;
}

function metaLocationCue(investment: Investment): string | null {
  if (MENTIONS_KRUPNIKI.test(investment.locationAddress)) {
    return 'Inwestycja w Krupnikach koło Białegostoku.';
  }
  if (MENTIONS_BIALYSTOK.test(investment.locationAddress)) {
    return 'Inwestycja w okolicy Białegostoku.';
  }
  return null;
}

function ensureSentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
