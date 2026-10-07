/**
 * Shared by every Dataverse environment we query. Settings are read by functions, never when
 * the file loads: Playwright loads every spec in a run, so a load-time check would
 * fail one domain's tests over another domain's missing setting.
 */

/** Microsoft Entra ID v1 client-credentials token endpoint, the same for every tenant. */
export const entraIdTokenUrl = (tenantId: string): string => `https://login.microsoftonline.com/${tenantId}/oauth2/token`;

/** Dataverse Web API version. */
export const DATAVERSE_API_PATH = '/api/data/v9.2';

/**
 * Own helper rather than service-base-urls.ts's getServiceBaseUrl, whose message
 * ("Ensure Playwright config applies it") is wrong for secrets. Names only, never values.
 */
export function requireEnv(...names: string[]): string[] {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not set. See .env.example; on CDP these come from the test suite's app-config and secrets.`,
    );
  }
  return names.map((name) => process.env[name]);
}

export interface DataverseCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export function getDataverseCredentials(): DataverseCredentials {
  const [tenantId, clientId, clientSecret] = requireEnv('DATAVERSE_TENANT_ID', 'DATAVERSE_CLIENT_ID', 'DATAVERSE_CLIENT_SECRET');
  return { tenantId, clientId, clientSecret };
}
