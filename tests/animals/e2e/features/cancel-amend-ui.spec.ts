import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/shared/sets';

test.describe('Cancel amendment through the UI', () => {
  test.describe('from an amending notification', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions }) => {
      const referenceNumber = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(referenceNumber);
    });

    test('shows the Cancel amend button while the notification is amending', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.btnCancelAmend).toBeVisible();
    });

    test('shows the Amend status bar with its Cancel amend link on Overview and a question page, and a Cancel amend button on the review', async ({
      animalsPages,
      journeyContext,
    }) => {
      const reference = journeyContext.referenceNumber;

      await animalsPages.overview.open(reference);
      await expect(animalsPages.overview.statusTag).toHaveText('Amend');
      await expect(animalsPages.overview.journeyStrip).toContainText(reference);
      await expect(animalsPages.overview.stripCancelAmend).toBeVisible();

      await animalsPages.originOfImport.open(reference);
      await expect(animalsPages.originOfImport.statusTag).toHaveText('Amend');
      await expect(animalsPages.originOfImport.journeyStrip).toContainText(reference);
      await expect(animalsPages.originOfImport.stripCancelAmend).toBeVisible();

      await animalsPages.notificationView.open(reference);
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(reference);
      await expect(animalsPages.notificationView.btnCancelAmend).toBeVisible();
    });

    test(
      'Cancel amend on the Overview opens the cancel-amendment confirmation page',
      { tag: '@cross-browser' },
      async ({ pages, animalsPages, journeyContext }) => {
        const reference = journeyContext.referenceNumber;

        await animalsPages.overview.open(reference);
        await animalsPages.overview.stripCancelAmend.click();

        await expect(pages.page).toHaveURL(animalsPages.notificationCancelAmend.expectedUrlPattern(reference));
        await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
      },
    );

    test('opens the confirmation page with the question, the confirm button and Go back, and no status strip or Back link', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      await animalsPages.notificationView.btnCancelAmend.click();

      await expect(pages.page).toHaveURL(animalsPages.notificationCancelAmend.expectedUrlPattern(journeyContext.referenceNumber));
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.confirm).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.goBack).toBeVisible();
      await expect(animalsPages.notificationCancelAmend.journeyStrip).toHaveCount(0);
      await expect(animalsPages.notificationCancelAmend.linkBack).toHaveCount(0);
    });

    test('Go back returns to the notification view with the amendment still in progress', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      await animalsPages.notificationView.btnCancelAmend.click();
      await animalsPages.notificationCancelAmend.goBack.click();

      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(journeyContext.referenceNumber));
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.btnCancelAmend).toBeVisible();
      await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
    });

    test('Cancel amend on a question page opens the confirmation page and Go back keeps the amendment', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      const reference = journeyContext.referenceNumber;
      await animalsPages.originOfImport.open(reference);

      await animalsPages.originOfImport.stripCancelAmend.click();

      await expect(pages.page).toHaveURL(animalsPages.notificationCancelAmend.expectedUrlPattern(reference));
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();

      await animalsPages.notificationCancelAmend.goBack.click();

      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(reference));
      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
      await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
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

      await animalsNotificationActions.changeCountryOfOrigin('Belgium');
      await expect(countryRow).toContainText('Belgium');

      await animalsPages.notificationView.btnCancelAmend.click();
      await animalsPages.notificationCancelAmend.confirm.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
      await expect(animalsPages.notificationView.viewHeader.reference).toBeVisible();
      await expect(animalsPages.notificationView.viewHeader.reference.locator('xpath=preceding-sibling::*')).toHaveCount(0);
      await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Submitted');
      await expect(animalsPages.notificationView.btnCancelAmend).toHaveCount(0);
      await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
      await expect(countryRow).toContainText('France');
    },
  );
});

test.describe('cancel-amend guard', () => {
  test('opening or posting the cancel-amendment address for a submitted notification changes nothing and opens the notification list', async ({
    pages,
    animalsPages,
    frontendForms,
    animalsSeededJourney,
  }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    const cancelAmendPath = animalsPages.notificationCancelAmend.expectedUrl(referenceNumber);

    await animalsPages.notificationCancelAmend.open(referenceNumber);

    await expect(pages.page).toHaveURL(SET_BASES.liveAnimals);
    await expect(animalsPages.dashboard.heading).toBeVisible();

    await frontendForms.postForm(cancelAmendPath, {}, { redirectsTo: new RegExp(`^${SET_BASES.liveAnimals}$`) });

    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Submitted');
  });
});

test.describe('Cancel amend without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test('the status bar Cancel amend on a question page restores the submitted answers', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });

    await animalsPages.originOfImport.open(reference);
    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await animalsPages.notificationView.open(reference);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(countryRow).toContainText('Belgium');

    await animalsPages.originOfImport.open(reference);
    await animalsPages.originOfImport.stripCancelAmend.click();
    await animalsPages.notificationCancelAmend.confirm.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?cancelled=1$/);
    await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Submitted');
    await expect(animalsPages.notificationView.btnCancelAmend).toHaveCount(0);
    await expect(countryRow).toContainText('France');
  });
});
