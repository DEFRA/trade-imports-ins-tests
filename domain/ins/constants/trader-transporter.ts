import { type PrivateTransporterDetails } from '@page-objects/ins/address-book/private-transporter-page';
import { type CommercialTransporterDetails } from '@page-objects/ins/address-book/commercial-transporter-page';

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
