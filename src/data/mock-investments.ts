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
  propertyType: 'dom jednorodzinny' | 'dom w zabudowie szeregowej' | 'lokal mieszkalny';
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

const investmentDescription = [
  'Słoneczna Polana IV to kolejny etap kameralnego osiedla domów w zabudowie wolnostojącej i szeregowej przy granicy Białegostoku, w Krupnikach przy ul. Różanej i Krokusowej.',
  'W tej fazie powstaje 6 nowych domów szeregowych o powierzchni 119,14 m² każdy, z garażem, własnym ogrodem, podjazdem oraz pełnym zakresem mediów.',
  'Inwestycja oferuje stan deweloperski, 2 kondygnacje z poddaszem nieużytkowym, ogrzewanie podłogowe, nowoczesną stolarkę trzyszybową i wygodny dojazd asfaltową drogą oraz kostką brukową.',
  'Planowana dostępność lokali to IV kwartał 2026 roku.',
].join(' ');

export const mockInvestment: Investment = {
  name: 'Słoneczna Polana IV etap',
  slug: 'sloneczna-polana-iv',
  summary: '6 nowych domów szeregowych 119,14 m² z garażem, planowana dostępność: IV kwartał 2026.',
  description: investmentDescription,
  locationAddress: 'ul. Różana i Krokusowa, Krupniki k. Białegostoku',
  heroImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  ],
  prospectusUrl: 'https://evenement.pl/prospekt-sloneczna-polana-iv.pdf',
  salesStatus: 'active',
  units: [
    {
      unitNumber: 'A1',
      slug: 'a1',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'available',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 144,
      shortDescription: 'Dom szeregowy z garażem, ogrodem i pełnymi mediami.',
      description: 'Nowy dom w zabudowie szeregowej o powierzchni 119,14 m², w stanie deweloperskim, z garażem, własnym ogrodem i podjazdem. Budynek wyposażony jest w ogrzewanie podłogowe na obu kondygnacjach, piec gazowy kondensacyjny Viessmann oraz trzon kominowy z możliwością podłączenia kominka.',
      mainImage: 'https://images.unsplash.com/photo-1560185008-b033106af5d9?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    },
    {
      unitNumber: 'A2',
      slug: 'a2',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'available',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 119.14,
      shortDescription: 'Funkcjonalny segment z nowoczesnymi rozwiązaniami i dużymi oknami.',
      description: 'Segment środkowy w ramach IV etapu Słonecznej Polany. Przemyślany układ pomieszczeń, nowoczesna architektura, 3-szybowe okna oraz estetyczne wykończenie stanu deweloperskiego tworzą wygodną przestrzeń do życia dla rodziny.',
      mainImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    },
    {
      unitNumber: 'A3',
      slug: 'a3',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'available',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 119.14,
      shortDescription: 'Dom szeregowy z podjazdem, garażem i dostępem do światłowodu.',
      description: 'Dom szeregowy na granicy Białegostoku, z pełnymi mediami, światłowodem KOBA, asfaltowym dojazdem oraz dostępem do infrastruktury miejskiej i terenów zielonych. Idealna propozycja dla osób szukających spokoju i szybkiego dojazdu do miasta.',
      mainImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    },
    {
      unitNumber: 'A4',
      slug: 'a4',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'available',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 119.14,
      shortDescription: 'Segment z ogrodem w otoczeniu lasów sosnowych i nowych domów.',
      description: 'Dom w zabudowie szeregowej położony w otoczeniu lasów sosnowych, łąk i nowoczesnej zabudowy. Dojazd wyłącznie asfalt i kostka brukowa, a w pobliżu znajdują się sklepy osiedlowe, przystanek autobusowy, szkoła i przedszkole.',
      mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    },
    {
      unitNumber: 'A5',
      slug: 'a5',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'reserved',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 119.14,
      shortDescription: 'Rezerwacja na dom z ogrzewaniem podłogowym i garażem.',
      description: 'Segment z rezerwacją, oferujący standard deweloperski, garaż w bryle budynku, pełne media oraz ogrzewanie podłogowe. Inwestycja powstaje z myślą o komforcie codziennego życia i funkcjonalnym układzie dla rodziny.',
      mainImage: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    },
    {
      unitNumber: 'A6',
      slug: 'a6',
      propertyType: 'dom w zabudowie szeregowej',
      status: 'available',
      usableAreaM2: 119.14,
      rooms: 5,
      floor: 0,
      plotAreaM2: 144,
      shortDescription: 'Skrajny segment z większą działką i dopłatą za większy ogród.',
      description: 'Skrajny dom szeregowy z większą działką, dostępny za dopłatą. Oferuje większą prywatność, własny ogród, nowoczesną bryłę budynku, pełne media i wysoki standard wykonania w spokojnej okolicy na granicy miasta.',
      mainImage: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
      priceHistory: [
        {
          validFrom: '2026-06-13',
          pricePerM2: 6500,
          baseTotalPrice: 774410,
          totalPriceWithComponents: 774410,
          vatIncluded: true,
          note: 'Cena aktualna',
        },
      ]
    }
  ]
};
