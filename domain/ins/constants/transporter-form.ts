export const TRANSPORTER_FORM_FIELD_LABELS = {
  name: 'Name or organisation',
  approvalNumber: 'Approval number',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  townOrCity: 'Town or city',
  county: 'County (optional)',
  postcode: 'Postcode or Zip code',
  country: 'Country',
  email: 'Email address',
  phone: 'Phone number',
} as const;

export const PRIVATE_TRANSPORTER_FIELD_LABELS_IN_ORDER = [
  TRANSPORTER_FORM_FIELD_LABELS.name,
  TRANSPORTER_FORM_FIELD_LABELS.addressLine1,
  TRANSPORTER_FORM_FIELD_LABELS.addressLine2,
  TRANSPORTER_FORM_FIELD_LABELS.townOrCity,
  TRANSPORTER_FORM_FIELD_LABELS.county,
  TRANSPORTER_FORM_FIELD_LABELS.postcode,
  TRANSPORTER_FORM_FIELD_LABELS.country,
  TRANSPORTER_FORM_FIELD_LABELS.email,
  TRANSPORTER_FORM_FIELD_LABELS.phone,
];

export const COMMERCIAL_TRANSPORTER_FIELD_LABELS_IN_ORDER = [
  TRANSPORTER_FORM_FIELD_LABELS.name,
  TRANSPORTER_FORM_FIELD_LABELS.approvalNumber,
  TRANSPORTER_FORM_FIELD_LABELS.addressLine1,
  TRANSPORTER_FORM_FIELD_LABELS.addressLine2,
  TRANSPORTER_FORM_FIELD_LABELS.townOrCity,
  TRANSPORTER_FORM_FIELD_LABELS.county,
  TRANSPORTER_FORM_FIELD_LABELS.postcode,
  TRANSPORTER_FORM_FIELD_LABELS.country,
  TRANSPORTER_FORM_FIELD_LABELS.email,
  TRANSPORTER_FORM_FIELD_LABELS.phone,
];

export const TRANSPORTER_FORM_VALIDATION_MESSAGES = {
  nameRequired: 'Enter a name or organisation',
  approvalNumberRequired: 'Enter the approval number',
  addressLine1Required: 'Enter address line 1',
  townOrCityRequired: 'Enter a town or city',
  postcodeRequired: 'Enter a postcode or Zip code',
  countryRequired: 'Select a country',
  countryFixed: 'A commercial transporter must be in Northern Ireland',
  emailRequired: 'Enter an email address',
  phoneRequired: 'Enter a phone number',
} as const;

/** A sample commercial transporter's approval number, in the shape the address book's own example
 * carries. */
export const SAMPLE_APPROVAL_NUMBER = 'UK/BELF/T2/00104115';
