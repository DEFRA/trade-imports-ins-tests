import { test, expect } from '@fixtures';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const WHOLE_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;
const DISPLAYED_DATE_PATTERN = /\d{1,2} \w+ \d{4}/;

test.describe('Import notification service dashboard', { tag: '@integration' }, () => {
  test('starts a journey at the origin page and lists the draft', async ({ journey, pages, animalsPages }) => {
    const journeyId = await journey.startNotification();

    await expect(pages.page).toHaveURL(animalsPages.overview.expectedUrl(journeyId));
    await expect(animalsPages.overview.heading).toBeVisible();

    const card = animalsPages.dashboard.notificationCard(journeyId);
    await expect(async () => {
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(journeyId);
      await expect(card).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();
    await expect(animalsPages.dashboard.resume(journeyId)).toBeVisible();
    await expect(animalsPages.dashboard.copyAsNew(journeyId)).toBeVisible();
    await expect(animalsPages.dashboard.delete(journeyId)).toBeVisible();
  });

  test.describe('dashboard basics', () => {
    test('lands on the notification dashboard', { tag: '@smoke' }, async ({ journey, pages, animalsPages }) => {
      await journey.toNotificationDashboard();
      await expect(pages.page).toHaveURL(animalsPages.dashboard.expectedUrl);
      await expect(animalsPages.dashboard.heading).toBeVisible();
    });

    test('allows creating a new notification, landing on the journey entry page', async ({ journey, animalsPages }) => {
      await journey.toNotificationDashboard();
      await animalsPages.dashboard.btnCreateNewNotification.click();
      await expect(animalsPages.originOfImport.heading).toBeVisible();
    });

    test('displays the notification list and result count', async ({ seededJourney, animalsPages }) => {
      const referenceNumber = await seededJourney.createDraftNotification('unlocked');
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);

      await expect(animalsPages.dashboard.heading).toBeVisible();
      await expect(animalsPages.dashboard.totalResults).toBeVisible();
      await expect(animalsPages.dashboard.notificationCards).toHaveCount(1);
    });

    test('displays details on a notification card', async ({ seededJourney, animalsPages }) => {
      test.slow();
      const referenceNumber = await seededJourney.createSubmittedNotification();
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);

      const details = animalsPages.dashboard.notificationCardDetails(0);
      await expect(details.heading).toContainText(referenceNumber);
      await expect(details.commodity).toBeVisible();
      await expect(details.origin).toBeVisible();
      await expect(details.arrivalAtDestination).toContainText(DISPLAYED_DATE_PATTERN);
      await expect(details.status).toContainText('Submitted');
      await expect(details.dateCreated).toHaveText(DISPLAYED_DATE_PATTERN);
    });
  });

  test.describe('notification card actions by status', () => {
    test('shows resume, copy and delete actions for a draft notification', async ({ animalsPages, seededJourney }) => {
      const referenceNumber = await seededJourney.createDraftNotification('unlocked');

      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);
      await expect(animalsPages.dashboard.notificationCardDetails(0).status).toContainText('Draft');
      await expect(animalsPages.dashboard.resume(referenceNumber)).toBeVisible();
      await expect(animalsPages.dashboard.copyAsNew(referenceNumber)).toBeVisible();
      await expect(animalsPages.dashboard.delete(referenceNumber)).toBeVisible();
      await expect(animalsPages.dashboard.amend(referenceNumber)).not.toBeVisible();
    });

    test('shows view, copy and amend actions for a submitted notification', async ({ animalsPages, seededJourney }) => {
      const referenceNumber = await seededJourney.createSubmittedNotification();

      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(referenceNumber);
      await expect(animalsPages.dashboard.notificationCardDetails(0).status).toContainText('Submitted');
      await expect(animalsPages.dashboard.view(referenceNumber)).toBeVisible();
      await expect(animalsPages.dashboard.copyAsNew(referenceNumber)).toBeVisible();
      await expect(animalsPages.dashboard.amend(referenceNumber)).toBeVisible();
    });

    test(
      'copies a submitted notification from its searched dashboard card',
      { tag: '@smoke' },
      async ({ animalsPages, journey, journeyContext }) => {
        test.slow();
        await journey.submitNotification();
        const originalReferenceNumber = journeyContext.journeyId;

        await animalsPages.dashboard.open();
        await animalsPages.dashboard.searchForReference(originalReferenceNumber);
        await animalsPages.dashboard.copyAsNew(originalReferenceNumber).click();

        await animalsPages.overview.heading.waitFor();
        const copiedReferenceNumber = (await animalsPages.notificationView.referenceNumberCaption.textContent())?.match(
          REFERENCE_NUMBER_PATTERN,
        )?.[0];
        expect(copiedReferenceNumber).toMatch(WHOLE_REFERENCE_NUMBER_PATTERN);
        expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
      },
    );
  });
});
