import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

test.describe('INS dashboard notification navigation', { tag: ['@integration'] }, () => {
  test('viewing a submitted notification from the INS dashboard opens it in the owning journey frontend', async ({
    journey,
    journeyContext,
    pages,
  }) => {
    test.slow();

    // Given — a notification has been submitted in the animals journey
    await journey.toDeclaration();
    const referenceNumber = journeyContext.journeyId;
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();
    await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();

    // When — the notification is found on the INS dashboard once the aggregated store has
    // caught up to SUBMITTED (its "View" link resolves to the hub, not notification-view,
    // until then) and its "View" link is opened
    await pages.insDashboard.open();
    await expect
      .poll(
        async () => {
          await pages.insDashboard.searchForReference(referenceNumber);
          return pages.insDashboard.viewLink(referenceNumber).getAttribute('href');
        },
        { timeout: timeouts.long },
      )
      .toContain('/notification-view');
    await pages.insDashboard.viewLink(referenceNumber).click();

    // Then — it lands on that notification's read-only view in trade-imports-animals-frontend
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));
    await expect(pages.notificationView.heading).toBeVisible();
  });
});
