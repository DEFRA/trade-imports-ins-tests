import { expect, type Page } from '@playwright/test';

export async function expectPageNotFound(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.getByText('Page not found', { exact: true })).toBeVisible();
}
