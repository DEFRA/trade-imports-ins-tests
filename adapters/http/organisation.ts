import { defaultUser } from '@config/users';

export const E2E_ORGANISATION_ID = defaultUser.organisationId;
export const OTHER_ORGANISATION_ID = '9999999';
export const ORGANISATION_ID_HEADER = 'Trade-Imports-Organisation-Id';

export type TraderApiClientOptions = {
  organisationId?: string;
  baseUrl?: string;
  apiKey?: string;
};

export function organisationHeaders(organisationId: string): Record<string, string> {
  return { [ORGANISATION_ID_HEADER]: organisationId };
}
