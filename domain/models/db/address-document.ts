import type { ObjectId } from 'mongodb';

export type AddressDocument = {
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
