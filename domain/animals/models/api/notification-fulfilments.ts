export const notificationFulfilmentsStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  submittedActionRequired: 'SUBMITTED_ACTION_REQUIRED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type NotificationFulfilmentsStatus = (typeof notificationFulfilmentsStatuses)[keyof typeof notificationFulfilmentsStatuses];

export type PersistedFulfilmentEntry =
  | { obligationId: string; value: unknown }
  | {
      obligationId: string;
      records: Array<{ fulfilmentId: string; value: unknown }>;
    };

export type NotificationFulfilments = {
  referenceNumber: string;
  concurrencyToken: number;
  fulfilments: PersistedFulfilmentEntry[];
  submittedFulfilments?: PersistedFulfilmentEntry[] | null;
  status: NotificationFulfilmentsStatus;
  created: string;
  submittedAt?: string | null;
  outstandingItems?: string[] | null;
};
