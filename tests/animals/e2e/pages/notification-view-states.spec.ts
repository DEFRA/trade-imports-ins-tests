import { CONSIGNMENT_ADDRESSES_INCOMPLETE, ADDRESSES_SECTION } from '@domain/animals/constants/consignment-addresses-page';
import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { ITAHC_DOCUMENT_TYPE_LABEL } from '@domain/animals/constants/document-types';
import { test, expect } from '@fixtures';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import type { AnimalsPages } from '@page-objects';
import { expectPageNotFound } from '@page-objects/shared/page-not-found';
import { expectImportReferencesAsText } from '@page-objects/shared/view-header';
import { todayOrYesterdayServiceDisplayDatePattern } from '@utils/date-utils';

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
      await animalsPages.notificationView.viewHeader.expectDraftReview();
      await expect(animalsPages.notificationView.viewHeader.btnAmend).toHaveCount(0);
      await expect(pages.page.getByRole('heading', { name: '1. About the consignment' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '2. Description of the goods' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '3. Transport and arrival' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: '4. Uploaded documents' })).toBeVisible();
      await expect(pages.page.getByRole('heading', { name: ADDRESSES_SECTION })).toBeVisible();
      const documentCard = animalsPages.notificationView.documentCard(1);
      await expect(documentCard).toBeVisible();
      await expect(animalsPages.notificationView.summaryValue(documentCard, 'Document reference')).toHaveText('Not applicable');
      await expect(animalsPages.notificationView.originOfImportCard).toContainText('France');
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
      await expectImportReferencesAsText(animalsPages.notificationView.viewHeader, {
        referenceNumber: journeyContext.referenceNumber,
        customsDocumentCode: 'C640',
      });
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
        CONSIGNMENT_ADDRESSES_INCOMPLETE,
      ]);
    });
  });

  test.describe('DRAFT ready to submit', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
    });

    test('shows no error summary once every section is answered', async ({ animalsPages }) => {
      await animalsPages.notificationView.viewHeader.expectDraftReview();
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

    test('is headed by its reference with no status bar and a title naming the reference', async ({
      pages,
      animalsPages,
      journeyContext,
    }) => {
      const { viewHeader } = animalsPages.notificationView;
      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(journeyContext.referenceNumber));
      await expect(viewHeader.reference).toHaveText(journeyContext.referenceNumber);
      await expect(animalsPages.notificationView.journeyStrip).toHaveCount(0);
      await expect(pages.page).toHaveTitle(`${journeyContext.referenceNumber} - Import notification service - GOV.UK`);
    });

    test('styles Amend this notification as primary, Copy as new as secondary and Delete as warning', async ({ animalsPages }) => {
      const { viewHeader, btnCopyAsNew, btnDelete, btnCancelAmend } = animalsPages.notificationView;
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
      await expectImportReferencesAsText(animalsPages.notificationView.viewHeader, {
        referenceNumber: journeyContext.referenceNumber,
        customsDocumentCode: 'C640',
      });
    });

    test('copies the submitted notification to a new draft', async ({ animalsPages, journeyContext }) => {
      const originalReferenceNumber = journeyContext.referenceNumber;
      await animalsPages.notificationView.btnCopyAsNew.click();

      await animalsPages.overview.heading.waitFor();
      const copiedReferenceNumber = (await animalsPages.notificationView.journeyStrip.textContent())?.match(REFERENCE_NUMBER_PATTERN)?.[0];
      expect(copiedReferenceNumber).toMatch(EXACT_REFERENCE_NUMBER_PATTERN);
      expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);
    });

    test("shows the uploaded health certificate's type on the Document 1 card", async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.documentCard(1)).toContainText(ITAHC_DOCUMENT_TYPE_LABEL);
    });

    test('still renders the recorded answers after submission', async ({ animalsPages }) => {
      await expect(animalsPages.notificationView.originOfImportCard).toContainText('France');
      await expect(animalsPages.notificationView.speciesBlock(commodityLines.cattle)).toBeVisible();
    });
  });

  const submittedSetUps = [
    {
      name: 'with its health certificate uploaded',
      setUp: (animalsSeededJourney: AnimalsSeededJourney, animalsPages: AnimalsPages) =>
        animalsSeededJourney.createSubmittedWithItahcUploadedInUi(animalsPages),
    },
    {
      name: 'without its health certificate',
      setUp: (animalsSeededJourney: AnimalsSeededJourney) => animalsSeededJourney.createSubmittedNotification(),
    },
  ];

  for (const { name, setUp } of submittedSetUps) {
    test.describe(`a notification submitted ${name}`, () => {
      test.beforeEach(async ({ animalsSeededJourney, animalsPages, animalsNotificationActions, journeyContext }) => {
        await setUp(animalsSeededJourney, animalsPages);
        await animalsNotificationActions.toNotificationView(journeyContext.referenceNumber);
      });

      test('is headed by a green Submitted tag', async ({ animalsPages }) => {
        const { statusTag } = animalsPages.notificationView.viewHeader;
        await expect(statusTag).toHaveText('Submitted');
        await expect(statusTag).toHaveClass(/govuk-tag--green/);
      });

      test('dates the notification with the service day it was submitted and shows the same date after a reload', async ({
        pages,
        animalsPages,
      }) => {
        const { dateSubmitted } = animalsPages.notificationView.viewHeader;
        await expect(dateSubmitted).toHaveText(new RegExp(`^Date submitted: ${todayOrYesterdayServiceDisplayDatePattern()}$`));
        const shown = await dateSubmitted.textContent();

        await pages.page.reload();

        await expect(dateSubmitted).toHaveText(shown ?? '');
      });

      test('offers exactly Amend this notification, Copy as new and Delete', async ({ pages }) => {
        await expect(pages.page.getByRole('main').getByRole('button')).toHaveText(['Amend this notification', 'Copy as new', 'Delete']);
      });
    });
  }

  test.describe('a notification that does not exist', () => {
    test('opening its view shows the standard page not found', async ({ pages, animalsPages }) => {
      await animalsPages.notificationView.open('GBN-AG-00-AAAAAA', { waitForReview: false });

      await expectPageNotFound(pages.page);
    });
  });
});
