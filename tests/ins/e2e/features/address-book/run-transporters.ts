import type { TransporterRequest } from '@adapters/http/address-book-api-client';
import { transporterTypes, COMMERCIAL_TRANSPORTER_COUNTRY_CODE } from '@domain/ins/constants/transporter-types';

export const commercialTransporterRequest = (name: string, approvalNumber: string): TransporterRequest => ({
  name,
  addressLine1: '4 Shore Road',
  townOrCity: 'Antrim',
  postcode: 'BT41 4LB',
  countryCode: COMMERCIAL_TRANSPORTER_COUNTRY_CODE,
  phone: '+44 28 9446 1200',
  email: 'ops@shoreroad.example',
  type: transporterTypes.commercial,
  approvalNumber,
});

export const privateTransporterRequest = (name: string): TransporterRequest => ({
  name,
  addressLine1: '4 Carrier Close',
  townOrCity: 'Carlisle',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0177',
  email: 'ops@carrier.example.co.uk',
  type: transporterTypes.private,
});
