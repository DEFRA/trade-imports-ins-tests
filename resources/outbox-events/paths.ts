import { fileURLToPath } from 'node:url';

const pathFromHere = (filename: string): string => fileURLToPath(new URL(filename, import.meta.url));

export const outboxEventPaths = {
  notificationSubmitted: pathFromHere('./notification-submitted-outbox-event.json'),
} as const;
