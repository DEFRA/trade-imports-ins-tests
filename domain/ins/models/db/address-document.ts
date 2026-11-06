import type { ObjectId } from 'mongodb';
import type { HeldRoles } from '@domain/shared/constants/address-types';

export type AddressDocument = Partial<HeldRoles> & {
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
