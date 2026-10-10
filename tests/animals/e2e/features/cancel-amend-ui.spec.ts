import { test, expect } from '@fixtures';

test.describe('Cancel amendment through the UI', { tag: ['@integration'] }, () => {
  test.describe('from an amending notification', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions }) => {
      const referenceNumber = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(referenceNumber);
    });

    test('shows the Cancel amend link while the notification is amending', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.cancelAmend).toBeVisible();
    });

    test('shows the Amend status bar with Cancel amend on Overview, a question page and the review', async ({
      animalsPages,
      journeyContext,
    }) => {
      const reference = journeyContext.referenceNumber;

      await animalsPages.overview.open(reference);
      await expect(animalsPages.overview.statusTag).toHaveText('Amend');
      await expect(animalsPages.overview.journeyStrip).toContainText(reference);
      await expect(animalsPages.overview.cancelAmend).toBeVisible();

      await animalsPages.originOfImport.open(reference);
      await expect(animalsPages.originOfImport.statusTag).toHaveText('Amend');
      await expect(animalsPages.originOfImport.journeyStrip).toContainText(reference);
      await expect(animalsPages.originOfImport.cancelAmend).toBeVisible();

      await animalsPages.notificationView.open(reference);
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(reference);
      await expect(animalsPages.notificationView.cancelAmend).toBeVisible();
    });

    test('Cancel amend on the Overview opens the cancel-amendment confirmation page', async ({ pages, animalsPages, journeyContext }) => {
      const reference = journeyContext.referenceNumber;

      await animalsPages.overview.open(reference);
      await animalsPages.overview.cancelAmend.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationCancelAmend.expectedUrl(reference)}$`));
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
    });

    test('opens the confirmation page when Cancel amend is selected', async ({ pages, animalsPages, journeyContext }) => {
      await animalsPages.notificationView.cancelAmend.click();

      await expect(pages.page).toHaveURL(
        new RegExp(`${animalsPages.notificationCancelAmend.expectedUrl(journeyContext.referenceNumber)}$`),
      );
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
      await expect(
        pages.page.getByText('Your changes since you started amending will be discarded and the submitted version restored.'),
      ).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.confirm).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.reject).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationCancelAmend.cancelAmend).toHaveCount(0);
    });

    test('No returns to the notification view with the amendment still in progress', async ({ pages, animalsPages, journeyContext }) => {
      await animalsPages.notificationView.cancelAmend.click();
      await animalsPages.notificationCancelAmend.reject.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationView.expectedUrl(journeyContext.referenceNumber)}$`));
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.cancelAmend).toBeVisible();
      await expect(animalsPages.notificationView.changeLink('Change import details')).toBeVisible();
    });

    test('Cancel amend on a question page opens the confirmation page and Go back keeps the amendment', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      const reference = journeyContext.referenceNumber;
      await animalsPages.originOfImport.open(reference);

      await animalsPages.originOfImport.cancelAmend.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationCancelAmend.expectedUrl(reference)}$`));
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();

      await animalsPages.notificationCancelAmend.reject.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationView.expectedUrl(reference)}$`));
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
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
      await animalsPages.originOfImport.saveAndReturn.click();
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(countryRow).toContainText('Belgium');

      await animalsPages.notificationView.cancelAmend.click();
      await animalsPages.notificationCancelAmend.confirm.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await expect(pages.page.getByRole('alert')).toContainText('The amendment has been cancelled and the submitted version restored.');
      await expect(animalsPages.notificationView.statusTag).toHaveText('Submitted');
      await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
      await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
      await expect(countryRow).toContainText('France');
    },
  );
});

test.describe('Cancel amend without JavaScript', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.use({ javaScriptEnabled: false });

  test('the status bar Cancel amend on a question page restores the submitted answers', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });

    await animalsPages.originOfImport.open(reference);
    await animalsPages.originOfImport.selectCountry('Belgium');
    await animalsPages.originOfImport.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(countryRow).toContainText('Belgium');

    await animalsPages.originOfImport.open(reference);
    await animalsPages.originOfImport.cancelAmend.click();
    await animalsPages.notificationCancelAmend.confirm.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(animalsPages.notificationView.statusTag).toHaveText('Submitted');
    await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
    await expect(countryRow).toContainText('France');
  });
});
