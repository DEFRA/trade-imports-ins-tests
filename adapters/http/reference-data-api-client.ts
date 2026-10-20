import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getDeveloperApiKey, getReferenceDataBaseUrl } from '@config/service-base-urls';
import type { CommodityLine } from '@domain/animals/constants/commodity-lines';

interface CommoditySpecies {
  latinName: string;
  commonName: string | null;
}

interface CommoditySearchResponse {
  groups: { code: string; species: CommoditySpecies[] }[];
}

// The page size the frontend's commodity search asks for, so a line found here
// is one the picker shows too.
const PICKER_PAGE_SIZE = 10;

/**
 * Direct HTTP access to reference-data's commodity search: the same rows the
 * frontend's picker lists, so a spec can expect what MDM says about a species
 * rather than a copy of it that goes stale.
 */
export class ReferenceDataApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getReferenceDataBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  /** The line's species as its own search lists it. Throws when the search does not list it. */
  async findSpecies(line: CommodityLine): Promise<CommoditySpecies> {
    const search = encodeURIComponent(line.searchTerm);
    const response = await this.rest.get<CommoditySearchResponse>(`/commodities?search=${search}&size=${PICKER_PAGE_SIZE}`);
    const species = response.groups
      .find((group) => group.code === line.code)
      ?.species.find((candidate) => candidate.latinName === line.latinName);
    if (!species) {
      throw new Error(`Searching "${line.searchTerm}" does not list ${line.latinName} under ${line.code}`);
    }
    return species;
  }
}
