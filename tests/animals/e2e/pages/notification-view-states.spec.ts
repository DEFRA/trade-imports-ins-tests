import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';
import type { AnimalsPages } from '@page-objects';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const EXACT_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;

const expectDeleteOpensConfirmation = async (animalsPages: AnimalsPages): Promise<void> => {
  await animalsPages.notificationView.btnDelete.click();
  await expect(animalsPages.deleteNotification.heading).toBeVisible();
};

test.describe('Notification view states', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.heading).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Uploaded documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '5. Consignment addresses' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '6. Contact address' })).toBeVisible();
      const documentCard = animalsPages.notificationView.summaryCard('Document 1');
      await expect(documentCard).toBeVisible();
      await expect(animalsPages.notificationView.summaryValue(documentCard, 'Document reference')).toHaveText('Not applicable');
      await expect(animalsPages.notificationView.summaryCard('Origin of import')).toContainText('France');
      await expect(animalsPages.notificationView.speciesBlock(commodityLines.cattle)).toContainText('Number of animals');
    });

    test('shows the Draft strip with the notification reference', async ({ animalsPages, journeyContext }) => {
      await expect(animalsPages.notificationView.statusTag).toHaveText('Draft');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(journeyContext.referenceNumber);
    });

    test('shows Change links for the recorded answers', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
      await expect(animalsPages.notificationView.changeCommodityLink(commodityLines.cattle)).toBeVisible();
    });

    test('ends with Continue and a warning Delete, with neither Copy as new nor Cancel amend', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.endControls).toHaveText(['Continue', 'Delete']);
      await expect(animalsPages.notificationView.btnDelete).toHaveClass(/govuk-button--warning/);
      await expect(animalsPages.notificationView.btnCopyAsNew).toHaveCount(0);
      await expect(animalsPages.notificationView.btnCancelAmend).toHaveCount(0);
    });

    test('Delete on a draft review opens the delete confirmation', async ({ animalsPages }) => {
      await expectDeleteOpensConfirmation(animalsPages);
    });

    test('Continue: when the notification is unfinished, stays put and names what is left', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();

      await expect(pages.page).toHaveURL(/\/notification-view\?refused=1$/);
      await expect(animalsPages.notificationView.errorSummary).toBeVisible();
      await expect(animalsPages.notificationView.errorSummary).toContainText('There is a problem');
      await expect(animalsPages.notificationView.errorSummaryLinks).toHaveText([
        'Complete main import reason',
        'Complete additional details',
        'Complete arrival details',
        'Complete transport details',
        'Complete roles and addresses',
        'Complete contact address for this consignment',
      ]);
    });
  });

  test.describe('DRAFT ready to submit', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
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
      const referenceNumber = await animalsSeededJourney.createAmendNotification();
      await animalsNotificationActions.toNotificationView(referenceNumber);
    });

    test('ends with Continue, Cancel amend and Delete', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.endControls).toHaveText(['Continue', 'Cancel amend', 'Delete']);
    });

    test('Cancel amend opens the cancel-amendment confirmation', async ({ animalsPages }) => {
      await animalsPages.notificationView.btnCancelAmend.click();

      await expect(animalsPages.notificationCancelAmend.heading).toBeVisible();
    });

    test('Delete on an amendment review opens the delete confirmation', async ({ animalsPages }) => {
      await expectDeleteOpensConfirmation(animalsPages);
    });
  });

  test.describe('SUBMITTED', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createSubmittedNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('lands on the view page with the Submitted strip and reference', async ({ pages, animalsPages, journeyContext }) => {
      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(journeyContext.referenceNumber));
      await expect(animalsPages.notificationView.statusTag).toHaveText('Submitted');
      await expect(animalsPages.notificationView.journeyStrip).toContainText(journeyContext.referenceNumber);
    });

    test('offers Copy as new and Delete on the read-only view', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.btnCopyAsNew).toBeVisible();
      await expect(animalsPages.notificationView.btnDelete).toBeVisible();
      await expect(animalsPages.notificationView.btnCancelAmend).toHaveCount(0);
    });

    test('copies the submitted notification to a new draft', async ({ animalsPages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.referenceNumber;
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
      await expect(animalsPages.notificationView.speciesBlock(commodityLines.cattle)).toBeVisible();
    });
  });
});
