export const languages = { it: 'Italiano', en: 'English' } as const;
export const defaultLang = 'it' as const;
export type Lang = keyof typeof languages;

export const ui = {
  it: {
    'nav.events': 'Eventi',
    'nav.discover': 'Scopri',
    'nav.participate': 'Partecipa',
    'nav.about': 'Chi siamo',
    'nav.contact': 'Contatti',
    'nav.discover.territory': 'Territorio',
    'nav.discover.recipes': 'Ricettario',
    'nav.discover.stories': 'Il dialetto e i modi di dire',
    'nav.discover.gallery': 'Immagini e ricordi',
    'nav.participate.membership': 'Tessera',
    'nav.participate.volunteers': 'Volontari',
    'home.heroCta.signup': 'Iscriviti',
    'home.heroCta.allEvents': 'Tutti gli eventi',
    'common.next': 'Prossimo',
    'common.allEvents': 'Tutti gli eventi',
    'footer.codiceFiscale': 'Codice fiscale',
    'footer.headquarters': 'Sede',
    'footer.press': 'Sei della stampa? → Press kit',
  },
  en: {
    'nav.events': 'Events',
    'nav.discover': 'Discover',
    'nav.participate': 'Participate',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.discover.territory': 'Territory',
    'nav.discover.recipes': 'Recipes',
    'nav.discover.stories': 'Dialect & sayings',
    'nav.discover.gallery': 'Images & memories',
    'nav.participate.membership': 'Membership',
    'nav.participate.volunteers': 'Volunteers',
    'home.heroCta.signup': 'Sign up',
    'home.heroCta.allEvents': 'All events',
    'common.next': 'Next',
    'common.allEvents': 'All events',
    'footer.headquarters': 'Office',
  },
} as const;

export type UiKey = keyof typeof ui['it'];
