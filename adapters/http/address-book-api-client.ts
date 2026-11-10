import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getAddressBookBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { AddressRole } from '@domain/shared/constants/address-types';
import type { TransporterType } from '@domain/ins/constants/transporter-types';

import { E2E_ORGANISATION_ID, organisationHeaders, type TraderApiClientOptions } from '@adapters/http/organisation';

interface StandardAddressBlockRecord {
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
  modifiedAt: string;
}

export interface AddressBookRecord extends StandardAddressBlockRecord {
  roles: AddressRole[];
}

export type AddressBookRequest = Omit<AddressBookRecord, 'id' | 'deleted' | 'modifiedAt'>;

export interface TransporterRecord extends StandardAddressBlockRecord {
  type: TransporterType;
  approvalNumber?: string;
}

export type TransporterRequest = Omit<TransporterRecord, 'id' | 'deleted' | 'modifiedAt'>;

interface ApiPage<T> {
  items: T[];
  totalItems: number;
}

/** Direct HTTP access to one organisation's address book. */
export class AddressBookApiClient {
  private readonly rest: RestClient;
  private readonly organisationId: string;

  constructor(request: APIRequestContext, options: TraderApiClientOptions = {}) {
    const { organisationId = E2E_ORGANISATION_ID, baseUrl = getAddressBookBaseUrl(), apiKey = getDeveloperApiKey() } = options;
    this.organisationId = organisationId;
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  private path(addressId?: string): string {
    const base = `/organisation/${this.organisationId}/addresses`;
    return addressId ? `${base}/${addressId}` : base;
  }

  private transporterPath(transporterId?: string): string {
    const base = `/organisation/${this.organisationId}/transporters`;
    return transporterId ? `${base}/${transporterId}` : base;
  }

  /**
   * The first page of the organisation's live addresses matching the search, newest first.
   * With `roles`, only addresses holding any of them; with `searchRoles`, an address holding any of them also
   * matches the search.
   */
  async listAddresses(
    query?: string,
    { roles = [], searchRoles = [] }: { roles?: readonly AddressRole[]; searchRoles?: readonly AddressRole[] } = {},
  ): Promise<AddressBookRecord[]> {
    const params = new URLSearchParams();
    for (const role of roles) {
      params.append('role', role);
    }
    for (const searchRole of searchRoles) {
      params.append('searchRole', searchRole);
    }
    if (query) {
      params.set('q', query);
    }
    const search = params.size ? `?${params}` : '';
    const page = await this.rest.get<ApiPage<AddressBookRecord>>(`${this.path()}${search}`, organisationHeaders(this.organisationId));
    return page.items;
  }

  /** Saves a new address to the organisation's book. */
  async createAddress(request: AddressBookRequest): Promise<AddressBookRecord> {
    return this.rest.post<AddressBookRecord>(this.path(), request, organisationHeaders(this.organisationId));
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
  async updateAddress(addressId: string, request: AddressBookRequest): Promise<AddressBookRecord> {
    return this.rest.put<AddressBookRecord>(this.path(addressId), request, organisationHeaders(this.organisationId));
  }

  /** One address by id, including a soft-deleted tombstone (`deleted: true`). */
  async getAddress(addressId: string): Promise<AddressBookRecord> {
    return this.rest.get<AddressBookRecord>(this.path(addressId), organisationHeaders(this.organisationId));
  }

  /** Soft-deletes an address. Deleting an address already deleted succeeds. */
  async deleteAddress(addressId: string): Promise<void> {
    await this.rest.delete(this.path(addressId), organisationHeaders(this.organisationId));
  }

  /** The first page of the organisation's live transporters matching the search, newest first. */
  async listTransporters(query?: string): Promise<TransporterRecord[]> {
    const search = query ? `?${new URLSearchParams({ q: query })}` : '';
    const page = await this.rest.get<ApiPage<TransporterRecord>>(
      `${this.transporterPath()}${search}`,
      organisationHeaders(this.organisationId),
    );
    return page.items;
  }

  /** Saves a new transporter to the organisation's book. */
  async createTransporter(request: TransporterRequest): Promise<TransporterRecord> {
    return this.rest.post<TransporterRecord>(this.transporterPath(), request, organisationHeaders(this.organisationId));
  }

  /** The live transporter with this name. Throws unless exactly one live transporter has it. */
  async findTransporterByName(name: string): Promise<TransporterRecord> {
    const matches = (await this.listTransporters(name)).filter((record) => record.name === name);
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one transporter named "${name}", found ${matches.length}`);
    }
    return matches[0];
  }

  /** Soft-deletes a transporter. Deleting a transporter already deleted succeeds. */
  async deleteTransporter(transporterId: string): Promise<void> {
    await this.rest.delete(this.transporterPath(transporterId), organisationHeaders(this.organisationId));
  }
}
