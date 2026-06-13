export interface PriceHistoryEntry {
  validFrom: string;
  pricePerM2: number;
  baseTotalPrice: number;
  totalPriceWithComponents: number;
  vatIncluded: boolean;
  note?: string;
}

export interface Unit {
  unitNumber: string;
  slug: string;
  propertyType: 'dom jednorodzinny' | 'lokal mieszkalny';
  status: 'available' | 'reserved' | 'sold' | 'hidden';
  usableAreaM2: number;
  rooms: number;
  floor: number;
  plotAreaM2?: number;
  shortDescription: string;
  description: string;
  mainImage: string;
  gallery?: string[];
  priceHistory: PriceHistoryEntry[];
}

export interface Investment {
  name: string;
  slug: string;
  summary: string;
  description: string;
  locationAddress: string;
  heroImage: string;
  gallery?: string[];
  prospectusUrl?: string;
  salesStatus: 'active' | 'ended';
  units: Unit[];
}

export const mockInvestment: Investment = {
  name: 'Ogrody Bemowo',
  slug: 'ogrody-bemowo',
  summary: 'Kameralna inwestycja w sercu Bemowa z widokiem na zieleń.',
  description: 'Ogrody Bemowo to nowoczesne osiedle mieszkaniowe zaprojektowane z myślą o rodzinach poszukujących komfortu, bezpieczeństwa i dogodnej komunikacji z centrum miasta. Inwestycja obejmuje budynki o niskiej zabudowie, otoczone starannie zaplanowaną zielenią, wyposażone w podziemne garaże, cichobieżne windy oraz nowoczesne systemy smart-home.',
  locationAddress: 'ul. Lazurowa 45, 01-315 Warszawa',
  heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  ],
  prospectusUrl: 'https://evenement.pl/prospekt-ogrody-bemowo.pdf',
  salesStatus: 'active',
  units: [
    {
      unitNumber: 'M-1',
      slug: 'mieszkanie-1',
      propertyType: 'lokal mieszkalny',
      status: 'available',
      usableAreaM2: 52.4,
      rooms: 2,
      floor: 1,
      shortDescription: 'Słoneczne 2-pokojowe mieszkanie z balkonem.',
      description: 'Funkcjonalne, dwupokojowe mieszkanie usytuowane na pierwszym piętrze budynku A. Składa się z przestronnego salonu z aneksem kuchennym, sypialni oraz łazienki. Do mieszkania przynależy balkon o powierzchni 6 m².',
      mainImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-01',
          pricePerM2: 12500,
          baseTotalPrice: 655000,
          totalPriceWithComponents: 655000,
          vatIncluded: true,
          note: 'Cena startowa',
        }
      ]
    },
    {
      unitNumber: 'M-2',
      slug: 'mieszkanie-2',
      propertyType: 'lokal mieszkalny',
      status: 'available',
      usableAreaM2: 74.8,
      rooms: 3,
      floor: 2,
      shortDescription: 'Przestronne 3-pokojowe mieszkanie rodzinne.',
      description: 'Komfortowe mieszkanie trzypokojowe z dwustronną ekspozycją na drugim piętrze budynku B. Idealne dla rodzin z dziećmi. Obejmuje duży salon, dwie sypialnie, garderobę, łazienkę oraz dodatkową toaletę.',
      mainImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-05-15',
          pricePerM2: 11800,
          baseTotalPrice: 882640,
          totalPriceWithComponents: 882640,
          vatIncluded: true,
          note: 'Cena promocyjna',
        },
        {
          validFrom: '2026-06-10',
          pricePerM2: 12100,
          baseTotalPrice: 905080,
          totalPriceWithComponents: 905080,
          vatIncluded: true,
          note: 'Aktualizacja cennika',
        }
      ]
    },
    {
      unitNumber: 'M-3',
      slug: 'mieszkanie-3',
      propertyType: 'lokal mieszkalny',
      status: 'reserved',
      usableAreaM2: 43.1,
      rooms: 1,
      floor: 0,
      shortDescription: 'Przytulna kawalerka z ogródkiem.',
      description: 'Jednopokojowe mieszkanie (kawalerka) na parterze z bezpośrednim wyjściem na przynależny ogródek. Doskonałe pod inwestycję lub na pierwsze mieszkanie.',
      mainImage: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-01',
          pricePerM2: 13200,
          baseTotalPrice: 568920,
          totalPriceWithComponents: 568920,
          vatIncluded: true,
        }
      ]
    }
  ]
};
