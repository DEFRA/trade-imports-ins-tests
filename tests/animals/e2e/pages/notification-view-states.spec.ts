import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';
import type { AnimalsPages } from '@page-objects';
import { todayOrYesterdayServiceDisplayDatePattern } from '@utils/date-utils';

const REFERENCE_NUMBER_PATTERN = /GBN-AG-\d{2}-[0-9A-Z]{6}/;
const EXACT_REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-Z]{6}$/;

const expectDeleteOpensConfirmation = async (animalsPages: AnimalsPages): Promise<void> => {
  await animalsPages.notificationView.btnDelete.click();
  await expect(animalsPages.deleteNotification.heading).toBeVisible();
};

const expectImportReferencesAsText = async (animalsPages: AnimalsPages, referenceNumber: string): Promise<void> => {
  const { viewHeader } = animalsPages.notificationView;
  await expect(viewHeader.importReferencesWarning).toContainText(
    'You must use the correct reference and code on the customs declaration or your consignment will be delayed.',
  );
  await expect(viewHeader.importReferenceValue('Notification reference')).toHaveText(referenceNumber);
  await expect(viewHeader.importReferenceValue('Customs document code')).toHaveText('C640');
  await expect(viewHeader.importReferences.getByRole('button')).toHaveCount(0);
};

test.describe('Notification view states', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('DRAFT', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('renders the recorded answers in the numbered design sections', async ({ pages, animalsPages }) => {
      await expect(animalsPages.notificationView.viewHeader.reference).toBeVisible();
      await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Draft');
      await expect(animalsPages.notificationView.statusTag).toHaveText('Draft');
      await expect(animalsPages.notificationView.viewHeader.btnAmend).toHaveCount(0);
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Uploaded documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '5. Consignment addresses' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '6. Contact address' })).toBeVisible();
      const documentCard = animalsPages.notificationView.documentCard(1);
      await expect(documentCard).toBeVisible();
      await expect(animalsPages.notificationView.summaryValue(documentCard, 'Document reference')).toHaveText('Not applicable');
      await expect(animalsPages.notificationView.summaryCard('Origin of import')).toContainText('France');
      await expect(animalsPages.notificationView.speciesBlock(commodityLines.cattle)).toContainText('Number of animals');
    });

    test('is headed by its reference', async ({ animalsPages, journeyContext }) => {
      await expect(animalsPages.notificationView.viewHeader.reference).toHaveText(journeyContext.referenceNumber);
    });

    test('shows a blue Draft tag', async ({ animalsPages }) => {
      const { statusTag } = animalsPages.notificationView.viewHeader;
      await expect(statusTag).toHaveText('Draft');
      await expect(statusTag).toHaveClass(/govuk-tag--blue/);
    });

    test('shows no status bar', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.journeyStrip).toHaveCount(0);
    });

    test('is titled with an Error prefix while the draft has incomplete sections', async ({ pages, journeyContext }) => {
      await expect(pages.page).toHaveTitle(`Error: ${journeyContext.referenceNumber} - Import notification service - GOV.UK`);
    });

    test('dates the notification with the service day it was created', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.viewHeader.dateCreated).toHaveText(
        new RegExp(`^Date created: ${todayOrYesterdayServiceDisplayDatePattern()}$`),
      );
    });

    test('offers a primary Copy as new then a warning Delete in its header, with no Amend this notification', async ({ animalsPages }) => {
      const { viewHeader, btnCopyAsNew, btnDelete } = animalsPages.notificationView;
      await expect(viewHeader.actions).toHaveText(['Copy as new', 'Delete']);
      await expect(btnCopyAsNew).not.toHaveClass(/govuk-button--secondary/);
      await expect(btnDelete).toHaveClass(/govuk-button--warning/);
      await expect(viewHeader.btnAmend).toHaveCount(0);
    });

    test("shows a draft's import reference numbers as text with the warning and no Copy button", async ({
      animalsPages,
      journeyContext,
    }) => {
      await expectImportReferencesAsText(animalsPages, journeyContext.referenceNumber);
    });

    test('shows Change links for the recorded answers', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.changeLink('Change origin of import')).toBeVisible();
      await expect(animalsPages.notificationView.changeCommodityLink(commodityLines.cattle)).toBeVisible();
    });

    test('ends with Continue alone, with no Cancel amend', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.endControls).toHaveText(['Continue']);
      await expect(animalsPages.notificationView.btnCancelAmend).toHaveCount(0);
    });

    test('Delete in the header of a draft review opens the delete confirmation', async ({ animalsPages }) => {
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
      await expect(animalsPages.notificationView.viewHeader.reference).toBeVisible();
      await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Draft');
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
    test.beforeEach(async ({ animalsSeededJourney, animalsPages, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createSubmittedWithItahcUploadedInUi(animalsPages);
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('is headed by its reference with a green Submitted tag, no status bar and a title naming the reference', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      const { viewHeader, statusTag } = animalsPages.notificationView;
      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(journeyContext.referenceNumber));
      await expect(viewHeader.reference).toHaveText(journeyContext.referenceNumber);
      await expect(statusTag).toHaveText('Submitted');
      await expect(statusTag).toHaveClass(/govuk-tag--green/);
      await expect(animalsPages.notificationView.journeyStrip).toHaveCount(0);
      await expect(pages.page).toHaveTitle(`${journeyContext.referenceNumber} - Import notification service - GOV.UK`);
    });

    test('dates the notification with the service day it was submitted', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.viewHeader.dateSubmitted).toHaveText(
        new RegExp(`^Date submitted: ${todayOrYesterdayServiceDisplayDatePattern()}$`),
      );
    });

    test('offers Amend this notification, a secondary Copy as new and a warning Delete in its header', async ({ animalsPages }) => {
      const { viewHeader, btnCopyAsNew, btnDelete, btnCancelAmend } = animalsPages.notificationView;
      await expect(viewHeader.actions).toHaveText(['Amend this notification', 'Copy as new', 'Delete']);
      await expect(viewHeader.btnAmend).not.toHaveClass(/govuk-button--secondary/);
      await expect(btnCopyAsNew).toHaveClass(/govuk-button--secondary/);
      await expect(btnDelete).toHaveClass(/govuk-button--warning/);
      await expect(btnCancelAmend).toHaveCount(0);
    });

    test('Amend this notification starts the amendment', async ({ animalsPages }) => {
      await animalsPages.notificationView.viewHeader.btnAmend.click();

      await expect(animalsPages.notificationView.statusTag).toHaveText('Amend');
    });

    test('Delete opens the delete confirmation', async ({ animalsPages }) => {
      await expectDeleteOpensConfirmation(animalsPages);
    });

    test('shows the import reference numbers as text with the warning and no Copy button', async ({ animalsPages, journeyContext }) => {
      await expectImportReferencesAsText(animalsPages, journeyContext.referenceNumber);
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

  test.describe('SUBMITTED_ACTION_REQUIRED', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createSubmittedNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('is headed by an orange Submitted action required tag and the warning to upload a health certificate', async ({
      animalsPages,
    }) => {
      const { viewHeader, statusTag } = animalsPages.notificationView;
      await expect(statusTag).toHaveText('Submitted action required');
      await expect(statusTag).toHaveClass(/govuk-tag--orange/);
      await expect(viewHeader.actionRequiredWarning).toBeVisible();
    });

    test('dates the notification and shows the same date after a reload', async ({ pages, animalsPages }) => {
      const { dateSubmitted } = animalsPages.notificationView.viewHeader;
      await expect(dateSubmitted).toHaveText(new RegExp(`^Date submitted: ${todayOrYesterdayServiceDisplayDatePattern()}$`));
      const shown = await dateSubmitted.textContent();

      await pages.page.reload();

      await expect(dateSubmitted).toHaveText(shown ?? '');
    });

    test('shows the health certificate error under the uploaded documents heading in place of document cards, with no error summary', async ({
      animalsPages,
    }) => {
      await expect(animalsPages.notificationView.documentsSectionError).toHaveText('Error: Upload a valid health certificate');
      await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
      await expect(animalsPages.notificationView.documentCard(1)).toHaveCount(0);
    });

    test('offers Amend this notification, Copy as new and Delete in its header', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.viewHeader.actions).toHaveText(['Amend this notification', 'Copy as new', 'Delete']);
    });

    test('shows the import reference numbers', async ({ animalsPages, journeyContext }) => {
      const { viewHeader } = animalsPages.notificationView;
      await expect(viewHeader.importReferenceValue('Notification reference')).toHaveText(journeyContext.referenceNumber);
      await expect(viewHeader.importReferenceValue('Customs document code')).toHaveText('C640');
    });

    test('Continue starts an amendment and opens the overview', async ({ animalsPages }) => {
      await animalsPages.notificationView.continueButton.click();

      await animalsPages.overview.heading.waitFor();
      await expect(animalsPages.overview.statusTag).toHaveText('Amend');
    });
  });

  test.describe('a notification that does not exist', () => {
    test('opening its view goes to the notification list', async ({ animalsPages }) => {
      await animalsPages.notificationView.openWithoutWaiting('GBN-AG-00-AAAAAA');

      await expect(animalsPages.dashboard.heading).toBeVisible();
    });
  });
});
