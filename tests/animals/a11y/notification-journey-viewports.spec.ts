import { test, WCAG_STANDARD, scanViewports } from '@fixtures/a11y';
import { scanNarrowPage } from '@utils/narrow-page-scan';

const narrowViewports = {
  'narrow portrait': scanViewports.narrowPortrait,
  'narrow landscape': scanViewports.narrowLandscape,
};

for (const [viewportName, viewport] of Object.entries(narrowViewports)) {
  test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
    test.use({ viewport });

    test(`the long notification pages have no accessibility violations and no sideways scrolling at ${viewportName}`, async ({
      page,
      animalsJourney,
      animalsSeededJourney,
      animalsPages,
      runA11yScan,
    }) => {
      await test.step('Review your notification (draft, continue refused with unfinished sections)', async () => {
        const draftReference = await animalsSeededJourney.createDraftNotification('unlocked');
        await animalsSeededJourney.resumeInUi(draftReference, animalsPages.notificationView);
        await animalsPages.notificationView.continueButton.click();
        await animalsPages.notificationView.errorSummary.waitFor();
        await scanNarrowPage(page, runA11yScan);
      });

      const completeReference = await animalsSeededJourney.createDraftNotification();

      await test.step('Overview (every task complete)', async () => {
        await animalsSeededJourney.resumeInUi(completeReference, animalsPages.overview);
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Consignment addresses with all parties added', async () => {
        await animalsSeededJourney.resumeInUi(completeReference, animalsPages.addresses);
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Animal identification with a saved animal', async () => {
        await animalsSeededJourney.resumeInUi(completeReference, animalsPages.animalIdentification);
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Review your notification (amending)', async () => {
        const amendReference = await animalsSeededJourney.createAmendNotification();
        await animalsSeededJourney.resumeInUi(amendReference, animalsPages.notificationView);
        await scanNarrowPage(page, runA11yScan);
      });

      await test.step('Upload documents with a saved document', async () => {
        await animalsJourney.toAccompanyingDocuments();
        await animalsJourney.uploadScannedDocument();
        await scanNarrowPage(page, runA11yScan);
      });
    });
  });
}
