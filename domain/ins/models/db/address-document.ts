import type { ObjectId } from 'mongodb';
import type { AddressClassification } from '@domain/shared/constants/address-types';

export type AddressDocument = Partial<AddressClassification> & {
  _id: ObjectId;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
  phone: string;
  email: string;
  organisationId: string;
  status: string;
  createdAt: Date;
  modifiedAt: Date;
  version: number;
  _class: string;
};
