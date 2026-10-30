import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getAddressBookBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';

/** The organisation id that CRN 2100010101, the default E2E sign-in, belongs to. */
export const E2E_ORGANISATION_ID = '5900001';

const ORGANISATION_ID_HEADER = 'Trade-Imports-Organisation-Id';

export interface AddressBookRecord {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
  phone: string;
  email: string;
  addressType?: string;
  uses?: string[];
  deleted: boolean;
}

export type AddressBookEntry = Omit<AddressBookRecord, 'id' | 'deleted'>;

interface AddressBookPage {
  items: AddressBookRecord[];
  totalItems: number;
}

/** Direct HTTP access to one organisation's address book. */
export class AddressBookApiClient {
  private readonly rest: RestClient;

  constructor(
    request: APIRequestContext,
    private readonly organisationId: string = E2E_ORGANISATION_ID,
    baseUrl: string = getAddressBookBaseUrl(),
    apiKey: string | undefined = getDeveloperApiKey(),
  ) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  private get headers(): Record<string, string> {
    return { [ORGANISATION_ID_HEADER]: this.organisationId };
  }

  private path(addressId?: string): string {
    const base = `/organisation/${this.organisationId}/addresses`;
    return addressId ? `${base}/${addressId}` : base;
  }

  /** The first page of the organisation's live addresses, newest first. */
  async listAddresses(query?: string): Promise<AddressBookRecord[]> {
    const search = query ? `?q=${encodeURIComponent(query)}` : '';
    const page = await this.rest.get<AddressBookPage>(`${this.path()}${search}`, this.headers);
    return page.items;
  }

  /** Saves a new address to the organisation's book. */
  async createAddress(record: AddressBookEntry): Promise<AddressBookRecord> {
    return this.rest.post<AddressBookRecord>(this.path(), record, this.headers);
  }

  /** The live address with this name. Throws unless exactly one live address has it. */
  async findByName(name: string): Promise<AddressBookRecord> {
    const matches = (await this.listAddresses(name)).filter((record) => record.name === name);
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one address named "${name}", found ${matches.length}`);
    }
    return matches[0];
  }

  /** Replaces an address with the whole record given. */
  async updateAddress(addressId: string, record: AddressBookEntry): Promise<AddressBookRecord> {
    return this.rest.put<AddressBookRecord>(this.path(addressId), record, this.headers);
  }

  /** One address by id, including a soft-deleted tombstone (`deleted: true`). */
  async getAddress(addressId: string): Promise<AddressBookRecord> {
    return this.rest.get<AddressBookRecord>(this.path(addressId), this.headers);
  }

  /** Soft-deletes an address. Deleting an address already deleted succeeds. */
  async deleteAddress(addressId: string): Promise<void> {
    await this.rest.delete(this.path(addressId), this.headers);
  }
}
