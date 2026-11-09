import { expect, type Locator, type Page } from '@playwright/test';
import type { NotificationPage } from '@page-objects/shared/base-page';

type OverviewTasks = { taskNames: Locator; taskStatuses: Locator; open(referenceNumber: string): Promise<void> };

type JourneyPage = NotificationPage & { heading: Locator };

export type SaveAndContinueStop = JourneyPage & { continueButton?: Locator };

const continuePressedOn = (stop: SaveAndContinueStop): Locator => stop.continueButton ?? stop.saveAndContinue;

/**
 * Opens the overview of `referenceNumber`, checks it lists exactly `tasks` and shows each Complete, then opens the review page.
 */
export async function openReviewFromCompleteOverview(
  overview: OverviewTasks,
  journey: { openReviewFromOverview(): Promise<void> },
  referenceNumber: string,
  tasks: readonly string[],
): Promise<void> {
  await overview.open(referenceNumber);
  await expect(overview.taskNames).toHaveText(tasks);
  await expect(overview.taskStatuses).toHaveText(tasks.map(() => 'Complete'));
  await journey.openReviewFromOverview();
}

/**
 * Presses Save and continue on each stop in turn, checking before every press that the stop is open at its exact address, carrying
 * the places already saved as its trail, and shows its heading; then checks the destination the same way.
 */
export async function expectSaveAndContinueWalk(
  page: Page,
  referenceNumber: string,
  trailBeforeFirstStop: string[],
  stops: readonly SaveAndContinueStop[],
  destination: JourneyPage,
): Promise<void> {
  const trail = [...trailBeforeFirstStop];
  for (const stop of stops) {
    await expectOpenOnTrail(page, referenceNumber, stop, trail);
    await continuePressedOn(stop).click();
    trail.push(stop.slug);
  }
  await expectOpenOnTrail(page, referenceNumber, destination, trail);
}

/**
 * Checks `page` is open at the exact address of `journeyPage` carrying the trail a review page's Change link writes: the review page's
 * slug after any `placesBeforeReview`.
 */
export async function expectOpenFromReview(
  page: Page,
  journeyPage: NotificationPage,
  referenceNumber: string,
  reviewSlug: string,
  placesBeforeReview: string[] = [],
): Promise<void> {
  await expect(page).toHaveURL(journeyPage.expectedUrlPatternOnTrail(referenceNumber, [...placesBeforeReview, reviewSlug]));
}

async function expectOpenOnTrail(page: Page, referenceNumber: string, journeyPage: JourneyPage, trail: string[]): Promise<void> {
  await expect(page).toHaveURL(journeyPage.expectedUrlPatternOnTrail(referenceNumber, trail));
  await expect(journeyPage.heading).toBeVisible();
}
