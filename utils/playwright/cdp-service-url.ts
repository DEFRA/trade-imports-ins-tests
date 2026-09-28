import { isCdpLocal } from '@utils/playwright/environment';

/**
 * Backend services' CDP URL. From inside CDP (CI), the direct per-service
 * subdomain resolves; from a developer's laptop it doesn't, so CDP_LOCAL=true
 * switches to the protected ephemeral gateway instead (path-based, not
 * subdomain-based, and requires DEVELOPER_API_KEY — see service-base-urls.ts).
 */
export function cdpServiceUrl(serviceName: string, environment: string): string {
  return isCdpLocal()
    ? `https://ephemeral-protected.api.${environment}.cdp-int.defra.cloud/${serviceName}`
    : `https://${serviceName}.${environment}.cdp-int.defra.cloud`;
}
