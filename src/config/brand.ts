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
  tagline: 'Wyjątkowe osiedla domów jednorodzinnych',
  description:
    'Kameralne inwestycje w Krupnikach — blisko lasu, ciszy i spokoju.',
  url: 'https://evenement24.com',
  locale: 'pl_PL',

  // ── Fonts ──────────────────────────────────────────────────────────────────
  // To swap fonts: change the `name` values here AND update astro.config.mjs
  // to match (both must stay in sync so Astro can optimise the correct files).
  fonts: {
    body: 'Source Sans 3',
    display: 'Archivo',
  },

  // ── Colour Palette ─────────────────────────────────────────────────────────
  // Core: white · charcoal #292728 · orange #F87216 · stone secondary
  // Neutrals stay warm-neutral gray (no green cast). Orange is CTA-only.
  // Mirror these hex values in src/styles/theme.css.
  colors: {
    // Charcoal — brand emphasis (nav active, badges, secondary buttons)
    primary:      '#292728',
    primaryLight: '#4F4C4D',
    primaryFg:    '#F7F7F4',

    // Orange — CTAs and highlights
    accent:       '#F87216',
    accentFg:     '#ffffff',

    // Stone — secondary accents (e.g. reserved status), not green
    secondary:    '#5C5650',
    secondaryFg:  '#F7F7F4',
    secondaryLight: '#7A736C',

    // Warm-neutral light spectrum
    background:   '#FFFFFF',
    surface:      '#F5F4F2',
    surfaceMuted: '#ECEBE8',
    border:       '#E0DED9',

    // Text on light backgrounds
    text:         '#292728',
    textMuted:    '#6B6866',

    // Dark sections (footer, overlays)
    dark:         '#1F1E1E',
    darkSurface:  '#333131',
  },

  // ── Border radius ──────────────────────────────────────────────────────────
  radius: {
    sm:   '0.25rem',
    md:   '0.375rem',
    lg:   '0.5rem',
    full: '9999px',
  },
} as const;

export type Brand = typeof brand;
