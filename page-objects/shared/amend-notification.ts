import { type Locator, type Page } from '@playwright/test';

export const amendNotificationHeading = (page: Page): Locator => page.getByRole('heading', { level: 1, name: 'Amend notification' });

export const amendNotificationConfirm = (page: Page): Locator => page.getByRole('button', { name: 'Yes, continue', exact: true });
