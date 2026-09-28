import { test, expect } from '@fixtures';

test.describe('Cancel amendment through the UI', { tag: ['@integration'] }, () => {
  test.describe('from an amending notification', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions }) => {
      const referenceNumber = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(referenceNumber);
    });

    test('shows the Cancel amendment link while the notification is amending', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.journeyStrip).toContainText('Amending');
      await expect(animalsPages.notificationView.cancelAmendment).toBeVisible();
    });

    test('opens the confirmation page when Cancel amendment is selected', async ({ pages, animalsPages, journeyContext }) => {
      await animalsPages.notificationView.cancelAmendment.click();

      await expect(pages.page).toHaveURL(
        new RegExp(`${animalsPages.notificationCancelAmend.expectedUrl(journeyContext.referenceNumber)}$`),
      );
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
      await expect(
        pages.page.getByText('Your changes since you started amending will be discarded and the submitted version restored.'),
      ).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.confirm).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.reject).toBeVisible();
    });

    test('No returns to the notification view with the amendment still in progress', async ({ pages, animalsPages, journeyContext }) => {
      await animalsPages.notificationView.cancelAmendment.click();
      await animalsPages.notificationCancelAmend.reject.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationView.expectedUrl(journeyContext.referenceNumber)}$`));
      await expect(animalsPages.notificationView.journeyStrip).toContainText('Amending');
      await expect(animalsPages.notificationView.cancelAmendment).toBeVisible();
      await expect(animalsPages.notificationView.changeLink('Change import details')).toBeVisible();
    });
  });

  test(
    'Yes cancels the amendment and restores the submitted answers',
    { tag: '@smoke' },
    async ({ pages, animalsPages, animalsSeededJourney, animalsNotificationActions }) => {
      const referenceNumber = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(referenceNumber);

      const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
      await expect(countryRow).toContainText('France');

      await animalsPages.notificationView.changeLink('Change import details').click();
      await expect(animalsPages.originOfImport.heading).toBeVisible();
      await animalsPages.originOfImport.selectCountry('Belgium');
      await animalsPages.originOfImport.saveAndContinue.click();
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(countryRow).toContainText('Belgium');

      await animalsPages.notificationView.cancelAmendment.click();
      await animalsPages.notificationCancelAmend.confirm.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await expect(pages.page.getByRole('alert')).toContainText('The amendment has been cancelled and the submitted version restored.');
      await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
      await expect(animalsPages.notificationView.cancelAmendment).not.toBeVisible();
      await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
      await expect(countryRow).toContainText('France');
    },
  );
});
