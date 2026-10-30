import { Page, Locator } from '@playwright/test';

export function notificationBannerTitled(page: Page, title: string): Locator {
  return page.locator('.govuk-notification-banner').filter({ has: page.getByRole('heading', { name: title }) });
}

export function errorSummaryOn(page: Page): Locator {
  return page.locator('.govuk-error-summary').filter({ has: page.getByRole('heading', { name: 'There is a problem' }) });
}
