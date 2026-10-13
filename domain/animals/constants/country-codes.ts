import { countryByCode } from '@domain/shared/fixtures/reference-data';

export const countryCodes = {
  eu: {
    austria: countryByCode('AT'),
    belgium: countryByCode('BE'),
    bulgaria: countryByCode('BG'),
    croatia: countryByCode('HR'),
    cyprus: countryByCode('CY'),
    czechia: countryByCode('CZ'),
    denmark: countryByCode('DK'),
    estonia: countryByCode('EE'),
    finland: countryByCode('FI'),
    france: countryByCode('FR'),
    germany: countryByCode('DE'),
    greece: countryByCode('GR'),
    hungary: countryByCode('HU'),
    iceland: countryByCode('IS'),
    ireland: countryByCode('IE'),
    italy: countryByCode('IT'),
    latvia: countryByCode('LV'),
    liechtenstein: countryByCode('LI'),
    lithuania: countryByCode('LT'),
    luxembourg: countryByCode('LU'),
    malta: countryByCode('MT'),
    netherlands: countryByCode('NL'),
    norway: countryByCode('NO'),
    poland: countryByCode('PL'),
    portugal: countryByCode('PT'),
    romania: countryByCode('RO'),
    slovakia: countryByCode('SK'),
    slovenia: countryByCode('SI'),
    spain: countryByCode('ES'),
    sweden: countryByCode('SE'),
    switzerland: countryByCode('CH'),
  },
};

export type CountryCode = { value: string; display: string };
