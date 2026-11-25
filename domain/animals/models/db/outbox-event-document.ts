import { expect } from '@playwright/test';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';

export type OutboxEventDocument = {
  _id: string;
  aggregateId: string;
  aggregateType: string;
  subType: string;
  aggregateVersion: number;
  eventType: string;
  timestamp: Date;
  data: GbnAgEventData;
  actor?: OutboxEventActor | null;
  statusChanges?: OutboxEventStatusChange[];
  metadata: {
    correlationId: string;
    schemaVersion: string;
    schemaUrl?: string;
  };
  _class?: string;
};

export type OutboxEventActor = {
  id: string | null;
  source: string | null;
  userType: string | null;
  displayName: string | null;
  organisationId: string | null;
  onBehalfOfOrganisationId: string | null;
};

export type OutboxEventStatusChange = {
  status: string;
  dateChanged: Date;
  actor?: OutboxEventActor | null;
};

export type GbnAgEventData = {
  $model: string;
  $type: string;
  exchangedDocument: GbnAgExchangedDocument;
  specifiedConsignment: GbnAgSpecifiedConsignment;
};

export type CodedValue = {
  value: string;
  urlId?: string;
  name?: string;
};

export type GbnAgExchangedDocument = {
  identifier: string;
  traderAssignedId?: string;
  notificationStatusCode?: string;
  versionId?: number;
  issueDateTime?: string;
  firstSignatoryAuthentication?: { includedClause: GbnAgClause[] };
  referenceDocument?: GbnAgReferencedDocument[];
};

const gbnAgExchangedDocumentKeyFlags = {
  identifier: true,
  traderAssignedId: true,
  notificationStatusCode: true,
  versionId: true,
  issueDateTime: true,
  firstSignatoryAuthentication: true,
  referenceDocument: true,
} satisfies Record<keyof GbnAgExchangedDocument, true>;

export const GBN_AG_EXCHANGED_DOCUMENT_KEYS = Object.keys(gbnAgExchangedDocumentKeyFlags);

export type GbnAgClause = {
  identifier: string;
  content?: string | null;
  urlId?: string | null;
};

export type GbnAgTradeParty = {
  identifier?: string;
  urlId?: string;
  name?: string;
  partyRoleCode?: CodedValue;
  partyTypeCode?: CodedValue[];
};

export type GbnAgTradeCountrySubDivision = {
  identifier?: string;
  urlId?: string;
  functionTypeCode?: { content: string };
};

export type GbnAgTradeCountry = {
  code?: CodedValue;
  subordinateTradeCountrySubDivision?: GbnAgTradeCountrySubDivision[] | null;
  regionOfOriginCode?: string | null;
};

export type GbnAgLogisticsLocation = {
  identifier?: string;
  urlId?: string;
  name?: string;
  typeCode?: string;
};

export type GbnAgReferencedDocument = {
  typeCode?: string;
  urlId?: string;
  identifier?: string;
  issueDateTime?: string;
};

export type GbnAgLogisticsTransportMovement = {
  modeCode?: number;
  transportContractRelatedReferencedDocument?: GbnAgReferencedDocument[];
};

export type GbnAgAnimalIdentifier = {
  typeCode: string;
  content: string;
  urlId?: string | null;
};

export type GbnAgTradeProductInstance = {
  name?: string;
  identifier?: GbnAgAnimalIdentifier[];
};

export type GbnAgTradeLineItem = {
  description?: string[];
  scientificName?: string;
  commonName?: string;
  specifiedLineTradeDelivery?: { productUnitQuantity: { content: number } }[];
  physicalReferencedLogisticsPackage?: { itemQuantity: number }[];
  individualTradeProductInstance?: GbnAgTradeProductInstance[];
};

export type GbnAgConsignmentItem = {
  includedTradeLineItem?: GbnAgTradeLineItem[];
};

export type GbnAgSpecifiedConsignment = {
  consignorParty?: GbnAgTradeParty;
  consigneeParty?: GbnAgTradeParty;
  despatchParty?: GbnAgTradeParty;
  deliveryParty?: GbnAgTradeParty;
  importer?: GbnAgTradeParty;
  carrier?: GbnAgTradeParty;
  originCountry?: GbnAgTradeCountry;
  unloadingBaseportLocation?: GbnAgLogisticsLocation;
  finalDestinationLocation?: GbnAgLogisticsLocation;
  mainCarriageLogisticsTransportMovement?: GbnAgLogisticsTransportMovement[];
  transitTradeCountry?: GbnAgTradeCountry[];
  isOrHasUnweanedAnimals?: boolean | null;
  includedConsignmentItem?: GbnAgConsignmentItem[];
};

export const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

export const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
  onBehalfOfOrganisationId: null,
};

export const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

export type OutboxReader = {
  eventsOf(referenceNumber: string, eventType?: string): Promise<OutboxEventDocument[]>;
  singleEventOf(referenceNumber: string, eventType: string): Promise<OutboxEventDocument>;
};

export const withOutbox = async <T>(read: (outbox: OutboxReader) => Promise<T>): Promise<T> => {
  const client = new MongoDbClient();
  try {
    await client.connect();
    const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
    const eventsOf: OutboxReader['eventsOf'] = (referenceNumber, eventType) =>
      collection
        .find({ aggregateId: aggregateIdFor(referenceNumber), ...(eventType && { eventType }) })
        .sort({ aggregateVersion: 1 })
        .toArray();
    const singleEventOf: OutboxReader['singleEventOf'] = async (referenceNumber, eventType) => {
      await expect.poll(async () => (await eventsOf(referenceNumber, eventType)).length, { timeout: timeouts.long }).toBe(1);
      const [event] = await eventsOf(referenceNumber, eventType);
      return event;
    };
    return await read({ eventsOf, singleEventOf });
  } finally {
    await client.close();
  }
};
