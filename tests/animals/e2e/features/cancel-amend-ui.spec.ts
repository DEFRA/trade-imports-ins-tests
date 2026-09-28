import { test, expect } from '@fixtures';

test.describe('Cancel amendment through the UI', { tag: ['@integration'] }, () => {
  test.describe('from an amending notification', () => {
    test.beforeEach(async ({ seededJourney, notificationActions }) => {
      const referenceNumber = await seededJourney.createAmendNotification();
      await notificationActions.toNotificationView(referenceNumber);
    });

    test('shows the Cancel amendment link while the notification is amending', async ({ pages }) => {
      await expect(pages.notificationView.journeyStrip).toContainText('Amending');
      await expect(pages.notificationView.cancelAmendment).toBeVisible();
    });

    test('opens the confirmation page when Cancel amendment is selected', async ({ pages, journeyContext }) => {
      await pages.notificationView.cancelAmendment.click();

      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationCancelAmend.expectedUrl(journeyContext.referenceNumber)}$`));
      await expect(pages.notificationCancelAmend.heading).toBeVisible();
      await expect(
        pages.page.getByText('Your changes since you started amending will be discarded and the submitted version restored.'),
      ).toBeVisible();
      await expect(pages.notificationCancelAmend.confirm).toBeVisible();
      await expect(pages.notificationCancelAmend.reject).toBeVisible();
    });

    test('No returns to the notification view with the amendment still in progress', async ({ pages, journeyContext }) => {
      await pages.notificationView.cancelAmendment.click();
      await pages.notificationCancelAmend.reject.click();

      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationView.expectedUrl(journeyContext.referenceNumber)}$`));
      await expect(pages.notificationView.journeyStrip).toContainText('Amending');
      await expect(pages.notificationView.cancelAmendment).toBeVisible();
      await expect(pages.notificationView.changeLink('Change import details')).toBeVisible();
    });
  });

  test(
    'Yes cancels the amendment and restores the submitted answers',
    { tag: '@smoke' },
    async ({ pages, seededJourney, notificationActions }) => {
      const referenceNumber = await seededJourney.createAmendNotification();
      await notificationActions.toNotificationView(referenceNumber);

      const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
      await expect(countryRow).toContainText('France');

      await pages.notificationView.changeLink('Change import details').click();
      await expect(pages.originOfImport.heading).toBeVisible();
      await pages.originOfImport.selectCountry('Belgium');
      await pages.originOfImport.saveAndContinue.click();
      await expect(pages.notificationView.heading).toBeVisible();
      await expect(countryRow).toContainText('Belgium');

      await pages.notificationView.cancelAmendment.click();
      await pages.notificationCancelAmend.confirm.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await expect(pages.page.getByRole('alert')).toContainText('The amendment has been cancelled and the submitted version restored.');
      await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
      await expect(pages.notificationView.cancelAmendment).not.toBeVisible();
      await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
      await expect(countryRow).toContainText('France');
    },
  );
});
