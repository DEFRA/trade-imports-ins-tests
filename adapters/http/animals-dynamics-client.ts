import type { APIRequestContext } from '@playwright/test';
import { DataverseClient, odataString } from '@adapters/http/dataverse-client';
import {
  ANIMALS_DYNAMICS_NOTIFICATIONS_ENTITY_SET,
  ANIMALS_DYNAMICS_REFERENCE_COLUMN,
  getAnimalsDynamicsUrl,
} from '@config/animals-dynamics';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';

/**
 * Looks up animals notifications in PIMS Dynamics. Built at the start of a test so a
 * missing PIMS Dynamics or Dataverse setting fails before the journey runs.
 */
export class AnimalsDynamicsClient {
  private readonly dataverse: DataverseClient;

  constructor(request: APIRequestContext) {
    this.dataverse = new DataverseClient(request, getAnimalsDynamicsUrl());
  }

  /**
   * Every PIMS Dynamics row for the reference, with all its columns; callers poll and decide how many rows they expect.
   * Typed as AnimalsDynamicsImporterNotification, which lists only the columns catalogued so far.
   */
  async findNotifications(referenceNumber: string): Promise<AnimalsDynamicsImporterNotification[]> {
    return this.dataverse.query<AnimalsDynamicsImporterNotification>(
      ANIMALS_DYNAMICS_NOTIFICATIONS_ENTITY_SET,
      this.referenceFilter(referenceNumber),
    );
  }

  /** As {@link findNotifications}, but each row carries only the named columns, and is typed to match. */
  async findNotificationsScopedToColumns<K extends keyof AnimalsDynamicsImporterNotification>(
    referenceNumber: string,
    columns: readonly K[],
  ): Promise<Pick<AnimalsDynamicsImporterNotification, K>[]> {
    return this.dataverse.query<Pick<AnimalsDynamicsImporterNotification, K>>(
      ANIMALS_DYNAMICS_NOTIFICATIONS_ENTITY_SET,
      this.referenceFilter(referenceNumber),
      columns,
    );
  }

  private referenceFilter(referenceNumber: string): string {
    return `${ANIMALS_DYNAMICS_REFERENCE_COLUMN} eq ${odataString(referenceNumber)}`;
  }
}
