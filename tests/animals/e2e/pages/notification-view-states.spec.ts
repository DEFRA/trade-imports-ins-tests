import { test, expect } from '@fixtures';
import { getRelativeServiceDisplayDate } from '@utils/date-utils';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const EXACT_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;

test.describe('Notification view states', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsNotificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(pages.page).toHaveTitle('Error: Review your notification - Import notification service - GOV.UK');
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Uploaded documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '5. Consignment addresses' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '6. Contact address' })).toBeVisible();
      const documentCard = animalsPages.notificationView.summaryCard('Document 1');
      await expect(animalsPages.notificationView.summaryValue(documentCard, 'Document reference')).toHaveText('Not applicable');
      await expect(pages.page.getByText('You have not added any documents yet.')).toHaveCount(0);
      await expect(animalsPages.notificationView.summaryCard('Origin of import')).toContainText('France');
      await expect(animalsPages.notificationView.summaryCard('Cow (0102)')).toContainText('Number of animals');
    });

    test('shows the Draft strip with the notification reference', async ({ animalsPages, journeyContext }) => {
      await expect(animalsPages.notificationView.journeyStrip.locator('.govuk-tag')).toHaveText('Draft');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(journeyContext.journeyId);
    });

    test('shows Change links for the recorded answers', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
      await expect(animalsPages.notificationView.changeLink('Change Cow (0102)')).toBeVisible();
    });

    test('ends with Continue and a red Delete, and offers neither Copy as new nor Cancel amend', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.continueButton).toBeVisible();
      await expect(animalsPages.notificationView.btnDelete).toBeVisible();
      await expect(animalsPages.notificationView.btnDelete).toHaveClass(/govuk-button--warning/);
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toHaveCount(0);
      await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
    });

    test('Delete opens the delete confirmation', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.btnDelete.click();

      await expect(pages.page).toHaveURL(/\/delete$/);
      await expect(pages.page.getByRole('heading', { level: 1, name: 'Delete this notification?' })).toBeVisible();
    });

    test('Continue: when the notification is unfinished, stays put and names what is left', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();

      await expect(pages.page).toHaveURL(/\/notification-view$/);
      await expect(animalsPages.notificationView.errorSummary).toBeVisible();
      await expect(animalsPages.notificationView.errorSummary).toContainText('There is a problem');
      await expect(animalsPages.notificationView.errorSummary.getByRole('link', { name: 'Complete arrival details' })).toBeVisible();
    });
  });

  test.describe('DRAFT ready to submit', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('readyToSubmit');
      await animalsNotificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('shows no error summary once every section is answered', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
    });

    test('Continue moves on to the declaration', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();
      await expect(pages.page).toHaveURL(/\/declaration$/);
      await expect(animalsPages.declaration.heading).toBeVisible();
    });
  });

  test.describe('AMEND', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions }) => {
      const reference = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(reference);
    });

    test('opens headed Review your notification with no error summary, ending with Continue, Cancel amend and Delete', async ({
      pages,
      animalsPages,
    }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(pages.page).toHaveTitle('Review your notification - Import notification service - GOV.UK');
      await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
      await expect(animalsPages.notificationView.continueButton).toBeVisible();
      await expect(animalsPages.notificationView.cancelAmend).toBeVisible();
      await expect(animalsPages.notificationView.cancelAmend).toHaveClass(/govuk-button--secondary/);
      await expect(animalsPages.notificationView.btnDelete).toBeVisible();
      await expect(animalsPages.notificationView.btnDelete).toHaveClass(/govuk-button--warning/);
      await expect(animalsPages.notificationView.statusBarCancelAmend).toHaveCount(0);
    });

    test('Cancel amend opens the cancel-amendment confirmation', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.cancelAmend.click();

      await expect(pages.page).toHaveURL(/\/cancel-amend$/);
      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
    });

    test('Delete opens the delete confirmation', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.btnDelete.click();

      await expect(pages.page).toHaveURL(/\/delete$/);
      await expect(pages.page.getByRole('heading', { level: 1, name: 'Delete this notification?' })).toBeVisible();
    });
  });

  test.describe('SUBMITTED', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createSubmittedNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.journeyId);
    });

    test('lands on the view page headed by its reference with a Submitted tag and no status bar', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.notificationView.expectedUrl(journeyContext.journeyId)}$`));
      await expect(animalsPages.notificationView.viewHeading(journeyContext.journeyId)).toBeVisible();
      await expect(animalsPages.notificationView.statusTag).toHaveText('Submitted');
      await expect(animalsPages.notificationView.statusTag).toHaveClass(/govuk-tag--green/);
      await expect(animalsPages.notificationView.journeyStrip).toHaveCount(0);
      await expect(animalsPages.notificationView.heading).toHaveCount(0);
      await expect(pages.page).toHaveTitle(`${journeyContext.journeyId} - Import notification service - GOV.UK`);
    });

    test('shows the date it was submitted', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.dateSubmitted).toHaveText(
        new RegExp(`^Date submitted: (${getRelativeServiceDisplayDate(-1)}|${getRelativeServiceDisplayDate()})$`),
      );
    });

    test('Back goes to the live-animals notification list', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.linkBack.click();

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.dashboard.expectedUrl}/?$`));
      await expect(animalsPages.dashboard.heading).toBeVisible();
    });

    test('offers Copy as new and Delete on the read-only view', async ({ pages, animalsPages }) => {
      await expect(pages.page.getByRole('button', { name: 'Copy as new' })).toBeVisible();
      await expect(pages.page.getByRole('button', { name: 'Delete' })).toBeVisible();
      await expect(animalsPages.notificationView.cancelAmend).toHaveCount(0);
    });

    test('copies the submitted notification to a new draft', async ({ animalsPages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.journeyId;
      await animalsPages.notificationView.btnCopyAsNew.click();

      await animalsPages.overview.heading.waitFor();
      const copiedReferenceNumber = (await animalsPages.notificationView.referenceNumberCaption.textContent())?.match(
        REFERENCE_NUMBER_PATTERN,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(EXACT_REFERENCE_NUMBER_PATTERN);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
    });

    test('still renders the recorded answers after submission', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.summaryCard('Origin of import')).toContainText('France');
      await expect(animalsPages.notificationView.summaryCard('Cow (0102)')).toBeVisible();
    });
  });

  test.describe('UNKNOWN', () => {
    test("an unknown notification's view goes to the live-animals notification list", async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.visit('GBN-AG-00-000000');

      await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.dashboard.expectedUrl}/?$`));
      await expect(animalsPages.dashboard.heading).toBeVisible();
    });
  });
});
