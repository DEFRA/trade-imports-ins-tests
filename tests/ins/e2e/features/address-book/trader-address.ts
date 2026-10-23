export const UNOFFERED_COUNTRY_CODE = 'XX';

export const traderAddress = (name: string) => ({
  name,
  addressLine1: '1 Trader Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0105',
  email: 'trader@example.co.uk',
});

export const traderAddressInUnofferedCountry = (name: string) => ({
  ...traderAddress(name),
  countryCode: UNOFFERED_COUNTRY_CODE,
});

export const addressWithLineTwoAndCounty = (name: string) => ({
  ...traderAddress(name),
  addressLine1: '3 Change Lane',
  addressLine2: 'Unit 9',
  county: 'Cumbria',
  phone: '01228 555 0104',
  email: 'edit@example.co.uk',
});
