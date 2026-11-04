import { expect, type Page } from '@playwright/test';
import { GOVUK_BLUE, WHITE } from '@domain/shared/constants/type-ahead';
import { type TypeAhead } from './type-ahead';

function resultCountAnnouncement(count: number): string {
  const result = count === 1 ? 'result' : 'results';
  const verb = count === 1 ? 'is' : 'are';
  return `${count} ${result} ${verb} available.`;
}

function firstOptionHighlightedAnnouncement(option: string, count: number): string {
  return `${resultCountAnnouncement(count)} ${option} 1 of ${count} is highlighted`;
}

export async function expectSearchButtonStyledAsGovukBlue(typeAhead: TypeAhead): Promise<void> {
  await expect(typeAhead.searchButton).toBeVisible();
  await expect(typeAhead.searchButton).toHaveCSS('background-color', GOVUK_BLUE);
  await expect.poll(() => typeAhead.searchIconBackgroundColour()).toBe(WHITE);
  await expect.poll(() => typeAhead.searchIconMaskImage()).toContain('url(');
}

export async function expectSearchButtonHiddenAndInert(page: Page, typeAhead: TypeAhead): Promise<void> {
  const urlBeforeClick = page.url();

  await expect(typeAhead.searchButton).toHaveAttribute('aria-hidden', 'true');
  await expect(typeAhead.searchButton).not.toHaveAttribute('tabindex');

  await typeAhead.field.focus();
  await page.keyboard.press('Tab');
  await expect(typeAhead.field).not.toBeFocused();
  await expect(typeAhead.searchButton).not.toBeFocused();

  await typeAhead.searchButton.click();
  await expect(typeAhead.field).toBeFocused();
  await expect(page).toHaveURL(urlBeforeClick);
}

export async function expectResultCountAnnounced(typeAhead: TypeAhead, typed: string, offered: string[]): Promise<void> {
  await typeAhead.search(typed);

  await expect(typeAhead.announcement(resultCountAnnouncement(offered.length))).toHaveCount(1);
}

export async function expectFirstOptionAnnounced(typeAhead: TypeAhead, typed: string, offered: string[]): Promise<void> {
  await typeAhead.searchAndHighlightFirstSuggestion(typed);

  await expect(typeAhead.announcement(firstOptionHighlightedAnnouncement(offered[0], offered.length))).toHaveCount(1);
}
