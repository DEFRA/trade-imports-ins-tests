import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { entraIdTokenUrl, DATAVERSE_API_PATH, getDataverseCredentials, type DataverseCredentials } from '@config/dataverse';

/** Quote a string for an OData $filter: single quotes are doubled. */
export const odataString = (value: string): string => `'${value.replaceAll("'", "''")}'`;

interface EntraIdTokenResponse {
  access_token?: string;
  error_description?: string;
}

/**
 * HTTP client for one Dataverse environment's Web API, authenticated app-only through
 * Microsoft Entra ID. Knows nothing about what any environment holds.
 */
export class DataverseClient {
  private readonly rest: RestClient;
  private token?: Promise<string>;

  constructor(
    private readonly request: APIRequestContext,
    private readonly environmentUrl: string,
    private readonly credentials: DataverseCredentials = getDataverseCredentials(),
  ) {
    this.rest = new RestClient(environmentUrl, request);
  }

  /** Without `select`, Dataverse returns every column. */
  async query<T>(entitySet: string, filter: string, select?: readonly string[]): Promise<T[]> {
    const { value } = await this.rest.get<{ value: T[] }>(
      `${DATAVERSE_API_PATH}/${entitySet}?$filter=${encodeURIComponent(filter)}${select ? `&$select=${select.join(',')}` : ''}`,
      {
        Authorization: `Bearer ${await this.getToken()}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    );
    return value;
  }

  // Cached: tokens last about an hour and a test lasts minutes, so each poll reuses one.
  private getToken(): Promise<string> {
    this.token ??= this.requestToken();
    return this.token;
  }

  // Reports only the status and Entra ID's error_description, never the form body (it holds the secret).
  private async requestToken(): Promise<string> {
    const { tenantId, clientId, clientSecret } = this.credentials;
    const response = await this.request.post(entraIdTokenUrl(tenantId), {
      form: { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, resource: this.environmentUrl },
    });
    const body = (await response.json()) as EntraIdTokenResponse;
    if (!response.ok()) {
      throw new Error(
        `Microsoft Entra ID token request responded ${response.status()}: ${body.error_description ?? 'no error_description'}`,
      );
    }
    return body.access_token;
  }
}
