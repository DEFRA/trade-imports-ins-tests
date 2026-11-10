import { expect, type Locator } from '@playwright/test';

async function visibleBoxesOf(upper: Locator, lower: Locator) {
  await expect(upper).toBeVisible();
  await expect(lower).toBeVisible();
  const upperBox = await upper.boundingBox();
  const lowerBox = await lower.boundingBox();
  expect(upperBox).not.toBeNull();
  expect(lowerBox).not.toBeNull();
  return { upperBox, lowerBox };
}

export async function expectAbove(upper: Locator, lower: Locator): Promise<void> {
  const { upperBox, lowerBox } = await visibleBoxesOf(upper, lower);
  expect(upperBox.y).toBeLessThan(lowerBox.y);
}

export async function expectEntirelyAbove(upper: Locator, lower: Locator): Promise<void> {
  const { upperBox, lowerBox } = await visibleBoxesOf(upper, lower);
  expect(upperBox.y + upperBox.height).toBeLessThanOrEqual(lowerBox.y);
}
