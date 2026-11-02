import { type Locator, type Page } from '@playwright/test';

export const deleteNotificationHeading = (page: Page): Locator =>
  page.getByRole('heading', { level: 1, name: 'Delete this notification?' });

export const deleteNotificationConfirm = (page: Page): Locator =>
  page.getByRole('button', { name: 'Yes, delete notification', exact: true });
