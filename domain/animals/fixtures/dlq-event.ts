import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { SqsClient } from '@adapters/queue/sqs-client';
import { getDlqUrl } from '@config/service-base-urls';
import { outboxEventPaths } from '@resources/outbox-events/paths';

interface OutboxEventFixture {
  eventId: string;
  aggregateId: string;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

const dlqEventTemplate = JSON.parse(readFileSync(outboxEventPaths.notificationSubmitted, 'utf-8')) as OutboxEventFixture;

/**
 * Seed one message directly onto the DLQ — the same shortcut the gateway's DlqServiceIT uses.
 * eventId (shown by the admin UI as the message Id) and the FIFO group are unique per seed, so a
 * run's assertions can't collide with, or be FIFO-blocked behind, a message left by another test.
 * Returns the eventId.
 */
export async function seedDlqMessage(sqs: SqsClient): Promise<string> {
  const eventId = randomUUID();
  const aggregateId = `${dlqEventTemplate.aggregateId}.${eventId}`;
  const event = {
    ...dlqEventTemplate,
    eventId,
    aggregateId,
    metadata: { ...dlqEventTemplate.metadata, correlationId: eventId },
  };
  await sqs.sendMessage(getDlqUrl(), JSON.stringify(event), aggregateId, eventId);
  return eventId;
}
