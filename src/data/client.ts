/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLIENT DATA
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared business contact data. Phone, email, legal details, registered
 * address, and sales office address are sourced from BaseHub; the remaining
 * site-specific fields stay in this module because they are not modeled in CMS yet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDeveloperContact } from '../lib/content';

const basehubContact = await getDeveloperContact();

export const client = {
  name: basehubContact.name,
  legalForm: basehubContact.legalForm ?? 'Spółka z ograniczoną odpowiedzialnością',
  nip: basehubContact.nip,
  nipFormatted: basehubContact.nipFormatted,
  regon: basehubContact.regon,
  email: basehubContact.email,
  phoneForTel: basehubContact.phoneHref,
  phoneFormatted: basehubContact.phoneFormatted,
  license: '',
  address: {
    lineOne: 'ul. Krokusowa 12',
    lineTwo: '',
    city: 'Krupniki',
    state: 'podlaskie',
    zip: '16-070',
    country: 'PL',
    mapLink: 'https://maps.google.com',
    geo: {
      // Village centroid (Nominatim) — street-level pin unavailable for Krokusowa 12
      latitude: 53.1307903,
      longitude: 23.0563949,
    },
  },
  salesOffice: {
    lineOne: basehubContact.salesOfficeAddress.lineOne,
    lineTwo: basehubContact.salesOfficeAddress.lineTwo ?? '',
    mapLink: 'https://maps.app.goo.gl/rbNMkR1xbUUue2Y69',
  },
  socials: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    google: 'https://www.google.com/maps',
  },
  domain: 'https://evenement24.com',
} as const;

export type Client = typeof client;
