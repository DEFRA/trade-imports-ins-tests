import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getAddressBookBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';

/**
 * The organisation CRN 2100010101 — the default E2E sign-in — belongs to, and
 * the one the shared journey address-book fixtures are created under via the API
 * (`ensureE2eAddressBook` in Playwright globalSetup).
 */
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
  deleted: boolean;
}

interface AddressBookPage {
  items: AddressBookRecord[];
  totalItems: number;
}

/**
 * Direct HTTP access to the address book, so a spec can change an address
 * behind the journey's back — the only way to show that a notification holds a
 * link to a record rather than a copy of it.
 *
 * The address book runs no authentication of its own: it trusts the
 * organisation header and requires it to match the organisation in the path.
 */
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
  async createAddress(record: Omit<AddressBookRecord, 'id' | 'deleted'>): Promise<AddressBookRecord> {
    return this.rest.post<AddressBookRecord>(this.path(), record, this.headers);
  }

  /** The one live address with this name. Throws when there is not exactly one. */
  async findByName(name: string): Promise<AddressBookRecord> {
    const matches = (await this.listAddresses(name)).filter((record) => record.name === name);
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one address named "${name}", found ${matches.length}`);
    }
    return matches[0];
  }

  /**
   * Replaces an address. The API takes the whole record, so the caller passes
   * the current one with the fields it wants changed already applied.
   */
  async updateAddress(addressId: string, record: Omit<AddressBookRecord, 'id' | 'deleted'>): Promise<AddressBookRecord> {
    return this.rest.put<AddressBookRecord>(this.path(addressId), record, this.headers);
  }

  /**
   * One address by id, including soft-deleted tombstones (`deleted: true`).
   * List endpoints omit tombstones; this is the only way to detect a deletion.
   */
  async getAddress(addressId: string): Promise<AddressBookRecord> {
    return this.rest.get<AddressBookRecord>(this.path(addressId), this.headers);
  }

  /**
   * Soft-deletes an address (204, idempotent). The tombstone stays readable via
   * {@link getAddress}; list/search no longer return it.
   */
  async deleteAddress(addressId: string): Promise<void> {
    await this.rest.delete(this.path(addressId), this.headers);
  }
}
