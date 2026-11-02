import type { APIRequestContext } from '@playwright/test';
import { DataverseClient, odataString } from '@adapters/http/dataverse-client';
import { requireEnv } from '@config/dataverse';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';

const NOTIFICATIONS_ENTITY_SET = 'defraimp_importernotifications';
const REFERENCE_COLUMN = 'defraimp_name';

// Trailing '/' stripped so the query URL and the token's `resource` match however the secret is typed.
const environmentUrl = (): string => requireEnv('ANIMALS_DYNAMICS_URL')[0].replace(/\/+$/, '');

/**
 * Looks up animals notifications in PIMS Dynamics. Built at the start of a test so a
 * missing PIMS Dynamics or Dataverse setting fails before the journey runs.
 */
export class AnimalsDynamicsClient {
  private readonly dataverse: DataverseClient;

  constructor(request: APIRequestContext) {
    this.dataverse = new DataverseClient(request, environmentUrl());
  }

  /**
   * Every PIMS Dynamics row for the reference, with all its columns; callers poll and decide how many rows they expect.
   * Typed as AnimalsDynamicsImporterNotification, which lists only the columns catalogued so far.
   */
  async findNotifications(referenceNumber: string): Promise<AnimalsDynamicsImporterNotification[]> {
    return this.dataverse.query<AnimalsDynamicsImporterNotification>(NOTIFICATIONS_ENTITY_SET, this.referenceFilter(referenceNumber));
  }

  /** As {@link findNotifications}, but each row carries only the named columns, and is typed to match. */
  async findNotificationsScopedToColumns<K extends keyof AnimalsDynamicsImporterNotification>(
    referenceNumber: string,
    columns: readonly K[],
  ): Promise<Pick<AnimalsDynamicsImporterNotification, K>[]> {
    return this.dataverse.query<Pick<AnimalsDynamicsImporterNotification, K>>(
      NOTIFICATIONS_ENTITY_SET,
      this.referenceFilter(referenceNumber),
      columns,
    );
  }

  private referenceFilter(referenceNumber: string): string {
    return `${REFERENCE_COLUMN} eq ${odataString(referenceNumber)}`;
  }
}
