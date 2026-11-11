import { randomUUID } from 'node:crypto';

export function uniqueToken(): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}`;
}
