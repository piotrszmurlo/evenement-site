/**
 * Sitemap <lastmod> values derived from BaseHub edit timestamps.
 *
 * BaseHub does not bubble `_sys.lastModifiedAt` up from nested blocks: a new
 * price-history entry leaves its unit and investment timestamps unchanged.
 * Each page's date is therefore the newest timestamp across every block it
 * renders.
 */
import { basehub } from 'basehub';

const SYS = { _sys: { lastModifiedAt: true } };

const LASTMOD_QUERY = {
  content: {
    ...SYS,
    developer: SYS,
    investments: {
      ...SYS,
      items: {
        slug: true,
        ...SYS,
        gallery: { ...SYS, items: SYS },
        units: {
          ...SYS,
          items: {
            ...SYS,
            gallery: { ...SYS, items: SYS },
            priceHistory: { ...SYS, items: SYS },
          },
        },
      },
    },
  },
};

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<(pathname: string) => string | undefined>} pathname → ISO date
 */
export async function loadSitemapLastmod(env) {
  if (!(env.BASEHUB_URL || (env.BASEHUB_TEAM && env.BASEHUB_REPO))) {
    return () => undefined;
  }

  const { content } = await basehub(basehubConfig(env)).query(LASTMOD_QUERY);
  const byPath = new Map();

  const investmentDates = content.investments.items.map((investment) => {
    const date = newest(collectSys(investment));
    byPath.set(`/inwestycje/${investment.slug}/`, date);
    return date;
  });

  const listingDate = newest([content.investments._sys.lastModifiedAt, ...investmentDates]);
  byPath.set('/inwestycje/', listingDate);
  byPath.set('/', newest([content._sys.lastModifiedAt, listingDate]));
  byPath.set('/kontakt/', newest(collectSys(content.developer)));

  return (pathname) => byPath.get(pathname);
}

function collectSys(node, out = []) {
  if (Array.isArray(node)) {
    for (const child of node) collectSys(child, out);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '_sys') out.push(value?.lastModifiedAt);
      else collectSys(value, out);
    }
  }
  return out;
}

function newest(dates) {
  const valid = dates.filter(Boolean).sort();
  return valid.at(-1);
}

function basehubConfig(env) {
  const { BASEHUB_TOKEN: token, BASEHUB_URL: url, BASEHUB_TEAM: team, BASEHUB_REPO: repo, BASEHUB_REF: ref } = env;
  const base = url ? { url } : { team, repo };
  return { ...base, ...(token && { token }), ...(ref && { ref }) };
}
