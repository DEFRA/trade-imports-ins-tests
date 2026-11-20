import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';
import { reviewHeadingText } from '@page-objects/animals/notification-view-page';

test.describe('Amend resubmission', () => {
  test('resubmits an amended notification: Submitted → Amend → Submitted with the edited answer kept', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();

    await animalsNotificationActions.amendNotification(journeyContext.referenceNumber);
    await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');

    await expect(animalsPages.notificationView.heading).toHaveText(reviewHeadingText);
    await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
    await expect(animalsPages.notificationView.changeCommodityLink(commodityLines.cattle)).toBeVisible();
    expect(await pages.page.getByRole('link', { name: /^Change/ }).count()).toBeGreaterThanOrEqual(4);
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await animalsNotificationActions.changeCountryOfOrigin('Belgium');
    await expect(countryRow).toContainText('Belgium');

    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Submitted');
    await expect(countryRow).toContainText('Belgium');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await expect(animalsPages.notificationView.btnCancelAmend).not.toBeVisible();

    await animalsPages.dashboard.open();
    await animalsPages.dashboard.searchForReference(journeyContext.referenceNumber);
    await expect(animalsPages.dashboard.amend(journeyContext.referenceNumber)).toBeVisible();
  });
});
