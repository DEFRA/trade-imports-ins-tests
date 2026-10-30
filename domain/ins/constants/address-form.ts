export const ADDRESS_FORM_FIELD_LABELS = {
  name: 'Name or organisation',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  townOrCity: 'Town or city',
  county: 'County (optional)',
  postcode: 'Postcode or Zip code',
  country: 'Country',
  email: 'Email address',
  phone: 'Phone number',
} as const;

export const ADDRESS_FORM_FIELD_LABELS_IN_ORDER = [
  ADDRESS_FORM_FIELD_LABELS.name,
  ADDRESS_FORM_FIELD_LABELS.addressLine1,
  ADDRESS_FORM_FIELD_LABELS.addressLine2,
  ADDRESS_FORM_FIELD_LABELS.townOrCity,
  ADDRESS_FORM_FIELD_LABELS.county,
  ADDRESS_FORM_FIELD_LABELS.postcode,
  ADDRESS_FORM_FIELD_LABELS.country,
  ADDRESS_FORM_FIELD_LABELS.email,
  ADDRESS_FORM_FIELD_LABELS.phone,
];

export const ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER = ADDRESS_FORM_FIELD_LABELS_IN_ORDER.filter(
  (label) => label !== ADDRESS_FORM_FIELD_LABELS.country,
);
