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
    'Kameralne i funkcjonalne nieruchomości dopasowane do Twoich potrzeb.',
  url: 'https://evenement24.com',
  locale: 'pl_PL',

  // ── Fonts ──────────────────────────────────────────────────────────────────
  // To swap fonts: change the `name` values here AND update astro.config.mjs
  // to match (both must stay in sync so Astro can optimise the correct files).
  fonts: {
    body: 'Inter',
    display: 'Oswald',
  },

  // ── Colour Palette ─────────────────────────────────────────────────────────
  // Core: cream #F9F8F3 · orange #F87216 · charcoal #292728 · olive #414728
  // Neutrals = warm light gray/white spectrum. Olive is special-use only.
  // Mirror these hex values in src/styles/theme.css.
  colors: {
    // Charcoal — brand emphasis (nav active, badges, secondary buttons)
    primary:      '#292728',
    primaryLight: '#4F4C4D',
    primaryFg:    '#F9F8F3',

    // Orange — CTAs and highlights
    accent:       '#F87216',
    accentFg:     '#ffffff',

    // Olive — secondary/tertiary, use sparingly for special moments
    secondary:    '#414728',
    secondaryFg:  '#F9F8F3',
    secondaryLight: '#5C6540',

    // Warm light spectrum
    background:   '#FFFFFF',
    surface:      '#F9F8F3',
    surfaceMuted: '#F3F2ED',
    border:       '#E5E4DF',

    // Text on light backgrounds
    text:         '#292728',
    textMuted:    '#6B6866',

    // Dark sections (footer, CTA bands)
    dark:         '#292728',
    darkSurface:  '#3A3839',
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
