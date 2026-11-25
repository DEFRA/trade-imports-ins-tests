import { expect } from '@playwright/test';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { aggregateIdFor, type OutboxEventActor, type OutboxEventDocument } from '@domain/animals/models/db/outbox-event-document';

export const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
  onBehalfOfOrganisationId: null,
};

export const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

export type OutboxReader = {
  eventsOf(referenceNumber: string, eventType?: string): Promise<OutboxEventDocument[]>;
  singleEventOf(referenceNumber: string, eventType: string): Promise<OutboxEventDocument>;
};

export const withOutbox = async <T>(read: (outbox: OutboxReader) => Promise<T>): Promise<T> => {
  const client = new MongoDbClient();
  try {
    await client.connect();
    const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
    const eventsOf: OutboxReader['eventsOf'] = (referenceNumber, eventType) =>
      collection
        .find({ aggregateId: aggregateIdFor(referenceNumber), ...(eventType && { eventType }) })
        .sort({ aggregateVersion: 1 })
        .toArray();
    const singleEventOf: OutboxReader['singleEventOf'] = async (referenceNumber, eventType) => {
      await expect.poll(async () => (await eventsOf(referenceNumber, eventType)).length, { timeout: timeouts.long }).toBe(1);
      const [event] = await eventsOf(referenceNumber, eventType);
      return event;
    };
    return await read({ eventsOf, singleEventOf });
  } finally {
    await client.close();
  }
};
