export const notificationStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  submittedActionRequired: 'SUBMITTED_ACTION_REQUIRED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type NotificationStatus = (typeof notificationStatuses)[keyof typeof notificationStatuses];
