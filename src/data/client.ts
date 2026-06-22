/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLIENT DATA
 * ─────────────────────────────────────────────────────────────────────────────
 * Business-specific copy: name, phone, email, address, socials.
 * Imported by Header, Footer, Contact page, and Head/SEO components.
 *
 * No component should hardcode a business name or phone number —
 * everything comes from this file or brand.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const client = {
  name: '"EVENEMENT M. Szmurło" Marek Szmurło',
  legalForm: 'Spółka z ograniczoną odpowiedzialnością',
  nip: '5421943411',
  regon: '200287001',
  email: 'marek_szmurlo@poczta.onet.pl',
  phoneForTel: '+48601625585',
  phoneFormatted: '+48 601 625 585',
  license: '',
  address: {
    lineOne: 'ul. Krokusowa 12',
    lineTwo: '',
    city: 'Krupniki',
    state: 'podlaskie',
    zip: '16-070',
    country: 'PL',
    mapLink: 'https://maps.google.com',
  },
  salesOffice: {
    lineOne: 'ul. Budowlanych 15',
    city: 'Warszawa',
    zip: '01-123',
    mapLink: 'https://maps.google.com',
  },
  socials: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    google: 'https://www.google.com/maps',
  },
  domain: 'https://evenement24.com',
} as const;

export type Client = typeof client;
