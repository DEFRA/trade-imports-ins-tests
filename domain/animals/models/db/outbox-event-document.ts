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

// The outbox event `data` is the GBN-AG payload produced by the backend GbnAgMapper
// (EUDPA-274), not the raw notification shape. Only the sections/fields the outbox
// E2E smoke-checks are typed; unmapped-for-now slots are omitted or left optional.
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
  subordinateTradeCountrySubDivision?: GbnAgTradeCountrySubDivision;
};

export type GbnAgLogisticsLocation = {
  identifier?: string;
  urlId?: string;
  name?: string;
  typeCode?: string;
};

export type GbnAgReferencedDocument = {
  typeCode?: string;
  identifier?: string;
};

export type GbnAgLogisticsTransportMovement = {
  modeCode?: number;
  transportContractRelatedReferencedDocument?: GbnAgReferencedDocument[];
};

export type GbnAgAnimalIdentifier = {
  typeCode: string;
  content: string;
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
  includedConsignmentItem?: GbnAgConsignmentItem[];
};
