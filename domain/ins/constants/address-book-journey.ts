import { getAnimalsFrontendBaseUrl } from '@config/service-base-urls';
import { SET_BASES } from '@page-objects/shared/sets';
import { addressRoles, type AddressRole } from '@domain/shared/constants/address-types';

const journeyTypes = {
  gbnAgGerminalProducts: 'gbn-ag-germinal-products',
} as const;

type JourneyType = (typeof journeyTypes)[keyof typeof journeyTypes];

const unregisteredJourneyType = 'not-a-journey';

export const journeyParties = {
  consignor: 'consignor',
} as const;

export type JourneyParty = (typeof journeyParties)[keyof typeof journeyParties];

export interface JourneyHandshake extends Record<string, string> {
  'journey-type': string;
  'notification-id': string;
  'fulfilment-id': string;
  'handshake-token': string;
}

const fulfilmentIdByParty: Record<JourneyParty, string> = {
  consignor: '9ad1e2f3-a4b5-4c60-8d1c-9e0f1a2b3c4d',
};

export const ownRoleByParty: Record<JourneyParty, AddressRole> = {
  consignor: addressRoles.consignor,
};

const setBaseByJourneyType: Record<JourneyType, string> = {
  [journeyTypes.gbnAgGerminalProducts]: SET_BASES.germinalProducts,
};

const GBN_AG_NOTIFICATION_ID = 'GBN-AG-26-4F7K2P';
const GERMINAL_PRODUCTS_NOTIFICATION_ID = 'GBN-AG-26-9K3M7Q';

const journeyHandshakeFor = (journeyType: string, party: JourneyParty, notificationId: string): JourneyHandshake => ({
  'journey-type': journeyType,
  'notification-id': notificationId,
  'fulfilment-id': fulfilmentIdByParty[party],
  'handshake-token': 'handshake-token-value',
});

export const germinalProductsJourneyHandshakeFor = (party: JourneyParty): JourneyHandshake =>
  journeyHandshakeFor(journeyTypes.gbnAgGerminalProducts, party, GERMINAL_PRODUCTS_NOTIFICATION_ID);

/** A handshake naming a fulfilment id the registry lists, under a journey type it does not. */
export const unregisteredJourneyHandshake: JourneyHandshake = journeyHandshakeFor(
  unregisteredJourneyType,
  journeyParties.consignor,
  GBN_AG_NOTIFICATION_ID,
);

/** The address a handshake's Back, Cancel and Save controls return to, on the animals frontend
 * under that handshake's own journey set base. */
export const journeyReturnUrlFor = (
  handshake: JourneyHandshake,
  { addressId, landing }: { addressId?: string; landing?: string } = {},
): string => {
  const setBase = setBaseByJourneyType[handshake['journey-type'] as JourneyType];
  const url = new URL(
    `${getAnimalsFrontendBaseUrl()}${setBase}/notifications/${encodeURIComponent(handshake['notification-id'])}/address-return`,
  );
  url.searchParams.set('fulfilment-id', handshake['fulfilment-id']);
  url.searchParams.set('handshake-token', handshake['handshake-token']);
  if (addressId) {
    url.searchParams.set('addressId', addressId);
  }
  if (landing) {
    url.searchParams.set('landing', landing);
  }
  return url.href;
};
