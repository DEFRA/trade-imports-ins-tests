import type { NotificationStatus } from '@domain/animals/models/api/notification-status';

export type PersistedFulfilmentEntry =
  | { obligationId: string; value: unknown }
  | {
      obligationId: string;
      records: Array<{ fulfilmentId: string; value: unknown }>;
    };

export type NotificationFulfilments = {
  referenceNumber: string;
  fulfilments: PersistedFulfilmentEntry[];
  submittedFulfilments?: PersistedFulfilmentEntry[] | null;
  status: NotificationStatus;
  created: string;
  submittedAt?: string | null;
};
