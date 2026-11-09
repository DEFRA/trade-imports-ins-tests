import type { TransporterRequest } from '@adapters/http/address-book-api-client';
import { type PrivateTransporterDetails } from '@page-objects/ins/address-book/private-transporter-page';
import { type CommercialTransporterDetails } from '@page-objects/ins/address-book/commercial-transporter-page';
import { COMMERCIAL_TRANSPORTER_COUNTRY_CODE, transporterTypes, type TransporterType } from '@domain/ins/constants/transporter-types';

const UNITED_KINGDOM_COUNTRY_CODE = 'GB';

export const privateTransporterDetails = (name: string, country: string = 'United Kingdom'): PrivateTransporterDetails => ({
  name,
  addressLine1: '4 Carrier Close',
  addressLine2: 'Unit 2',
  townOrCity: 'Carlisle',
  county: 'Cumbria',
  postcode: 'CA1 3CC',
  country,
  email: 'ops@carrier.example.co.uk',
  phone: '01228 555 0177',
});

export const commercialTransporterDetails = (name: string, approvalNumber: string): CommercialTransporterDetails => ({
  name,
  approvalNumber,
  addressLine1: '4 Shore Road',
  addressLine2: 'Unit 2',
  townOrCity: 'Antrim',
  county: 'County Antrim',
  postcode: 'BT41 4LB',
  email: 'ops@shoreroad.example',
  phone: '+44 28 9446 1200',
});

/** The address book's create request for a transporter form's details, in the shape the API
 * expects rather than the form's own field names. */
export const transporterRequestOf = (
  details: PrivateTransporterDetails | CommercialTransporterDetails,
  type: TransporterType,
): TransporterRequest => ({
  name: details.name,
  addressLine1: details.addressLine1,
  townOrCity: details.townOrCity,
  postcode: details.postcode,
  countryCode: type === transporterTypes.commercial ? COMMERCIAL_TRANSPORTER_COUNTRY_CODE : UNITED_KINGDOM_COUNTRY_CODE,
  phone: details.phone,
  email: details.email,
  type,
  ...('approvalNumber' in details ? { approvalNumber: details.approvalNumber } : {}),
});
