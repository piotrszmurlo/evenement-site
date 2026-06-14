/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BRAND CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Single file to edit when adapting the theme for a new client.
 *
 * Colors flow into  → src/styles/theme.css  (CSS custom properties)
 * Fonts flow into   → astro.config.mjs      (Astro 6 built-in font optimizer)
 * Meta flows into   → src/layouts/BaseLayout.astro
 *
 * Color format: use hex (#1a1a2e) or CSS color values.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const brand = {
  // ── Site Identity ──────────────────────────────────────────────────────────
  name: 'Evenement',
  tagline: 'Nowoczesne inwestycje deweloperskie.',
  description:
    'Kameralne i funkcjonalne nieruchomości dopasowane do Twoich potrzeb. Poznaj nowe inwestycje od Evenement.',
  url: 'https://evenement.pl',
  locale: 'pl_PL',

  // ── Fonts ──────────────────────────────────────────────────────────────────
  // To swap fonts: change the `name` values here AND update astro.config.mjs
  // to match (both must stay in sync so Astro can optimise the correct files).
  fonts: {
    body: 'Inter',
    display: 'Oswald',
  },

  // ── Colour Palette ─────────────────────────────────────────────────────────
  // These values are written to CSS custom properties in theme.css.
  // Tailwind v4 @theme picks them up automatically.
  colors: {
    primary:      '#1B3A6B',
    primaryLight: '#2563EB',
    primaryFg:    '#ffffff',

    accent:       '#F97316',
    accentFg:     '#ffffff',

    background:   '#ffffff',
    surface:      '#F8FAFC',
    border:       '#E2E8F0',

    text:         '#0F172A',
    textMuted:    '#475569',

    dark:         '#0F172A',
    darkSurface:  '#1E293B',
  },

  // ── Border radius ──────────────────────────────────────────────────────────
  radius: {
    sm:   '0.375rem',
    md:   '0.625rem',
    lg:   '1rem',
    full: '9999px',
  },
} as const;

export type Brand = typeof brand;
