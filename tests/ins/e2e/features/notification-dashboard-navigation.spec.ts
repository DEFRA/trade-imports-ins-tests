import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { parseAppDateText, toShortDisplayDate } from '@utils/date-utils';

test.describe('INS dashboard notification navigation', { tag: ['@animals-backend', '@animals-frontend'] }, () => {
  test('the INS dashboard shows a submitted notification with the arrival day entered, and its View link opens it in the owning journey frontend', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    insPages,
  }) => {
    test.slow();

    await animalsJourney.toDeclaration();
    const referenceNumber = journeyContext.referenceNumber;
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();

    await insPages.dashboard.open();
    await expect
      .poll(
        async () => {
          await insPages.dashboard.searchForReference(referenceNumber);
          return insPages.dashboard.viewLink(referenceNumber).getAttribute('href');
        },
        { timeout: timeouts.long },
      )
      .toContain('/notification-view');
    const arrivalDisplayDate = toShortDisplayDate(parseAppDateText(MANDATORY_ANSWERS.arrivalDate));
    await expect(insPages.dashboard.row(referenceNumber).getByRole('cell', { name: arrivalDisplayDate, exact: true })).toBeVisible();
    await insPages.dashboard.viewLink(referenceNumber).click();

    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});
