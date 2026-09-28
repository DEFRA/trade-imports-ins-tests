import { test, expect } from '@fixtures';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const EXACT_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;

test.describe('Notification view states', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ seededJourney, notificationActions, journeyContext }) => {
      await seededJourney.createDraftNotification('unlocked');
      await notificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages }) => {
      await expect(pages.notificationView.heading).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '5. Consignment parties' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '6. Contact address' })).toBeVisible();
      await expect(pages.notificationView.summaryCard('Uploaded documents')).toBeVisible();
      await expect(pages.notificationView.summaryCard('Uploaded documents')).toContainText('You have not added any documents yet.');
      await expect(pages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(pages.notificationView.summaryCard('Cow (0102) — Bos taurus')).toContainText('Number of animals');
    });

    test('shows the Draft strip with the notification reference', async ({ pages, journeyContext }) => {
      await expect(pages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Draft');
      await expect(pages.notificationView.journeyStrip).toContainText(journeyContext.journeyId);
    });

    test('shows Change links for the recorded answers', async ({ pages }) => {
      await expect(pages.notificationView.changeLink('Change import details')).toBeVisible();
      await expect(pages.notificationView.changeLink('Change commodity 1')).toBeVisible();
    });

    test('offers submission and none of the post-submit actions', async ({ pages }) => {
      await expect(pages.notificationView.continueButton).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toHaveCount(0);
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
      await expect(pages.notificationView.cancelAmendment).toHaveCount(0);
    });

    test('Continue: when the notification is unfinished, stays put and names what is left', async ({ pages }) => {
      await pages.notificationView.continueButton.click();

      await expect(pages.page).toHaveURL(/\/notification-view$/);
      await expect(pages.notificationView.errorSummary).toBeVisible();
      await expect(pages.notificationView.errorSummary).toContainText('There is a problem');
      await expect(pages.notificationView.errorSummary.getByRole('link', { name: 'Complete arrival details' })).toBeVisible();
    });
  });

  test.describe('DRAFT ready to submit', () => {
    test.beforeEach(async ({ seededJourney, notificationActions, journeyContext }) => {
      await seededJourney.createDraftNotification('readyToSubmit');
      await notificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('shows no error summary once every section is answered', async ({ pages }) => {
      await expect(pages.notificationView.heading).toBeVisible();
      await expect(pages.notificationView.errorSummary).toHaveCount(0);
    });

    test('Continue moves on to the declaration', async ({ pages }) => {
      await pages.notificationView.continueButton.click();
      await expect(pages.page).toHaveURL(/\/declaration$/);
      await expect(pages.declaration.heading).toBeVisible();
    });
  });

  test.describe('SUBMITTED', () => {
    test.beforeEach(async ({ seededJourney, notificationActions, journeyContext }) => {
      await seededJourney.createSubmittedNotification();
      await notificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('lands on the view page with the Submitted strip and reference', async ({ pages, journeyContext }) => {
      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationView.expectedUrl(journeyContext.journeyId)}$`));
      await expect(pages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Submitted');
      await expect(pages.notificationView.journeyStrip).toContainText(journeyContext.journeyId);
    });

    test('offers Copy as new and Delete on the read-only view', async ({ pages }) => {
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toBeVisible();
      await expect(pages.notificationView.cancelAmendment).toHaveCount(0);
    });

    test('copies the submitted notification to a new draft', async ({ pages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.journeyId;
      await pages.notificationView.btnCopyAsNew.click();

      await pages.overview.heading.waitFor();
      const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(
        REFERENCE_NUMBER_PATTERN,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(EXACT_REFERENCE_NUMBER_PATTERN);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
    });

    test('still renders the recorded answers after submission', async ({ pages }) => {
      await expect(pages.notificationView.summaryCard('Import details')).toContainText('France');
      await expect(pages.notificationView.summaryCard('Cow (0102) — Bos taurus')).toBeVisible();
    });
  });
});
