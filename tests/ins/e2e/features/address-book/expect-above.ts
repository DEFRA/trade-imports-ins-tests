import { expect } from '@fixtures';
import type { Locator } from '@playwright/test';

export async function expectAbove(upper: Locator, lower: Locator): Promise<void> {
  await expect(upper).toBeVisible();
  await expect(lower).toBeVisible();
  const upperBox = await upper.boundingBox();
  const lowerBox = await lower.boundingBox();
  expect(upperBox).not.toBeNull();
  expect(lowerBox).not.toBeNull();
  expect(upperBox.y).toBeLessThan(lowerBox.y);
}
