import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { expectOpenFromReview, expectSaveAndContinueWalk } from '@page-objects/shared/journey-checks';
import { DOCUMENT_ISSUE_DATE } from '@resources/file-upload/constants';
import { CONSIGNEE_NAME, CONTACT_ADDRESS_NAME } from '@domain/shared/constants/journey-party-names';

test.describe('Change from check your answers', { tag: '@duplicated-in-frontend' }, () => {
  test('a Change link opens the answering page with the review on the trail, and the review shows the new value after the save', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.originOfImport, referenceNumber, animalsPages.notificationView.slug);
    await animalsPages.originOfImport.country.choose('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));
    await expect(countryRow).toContainText('Belgium');

    const certifiedForRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Certified for' });
    await expect(certifiedForRow).toContainText('Slaughter');
    await animalsPages.notificationView.changeLink('Change additional animal details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.additionalDetails, referenceNumber, animalsPages.notificationView.slug);
    await animalsPages.additionalDetails.certifiedFor('Exhibition').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await animalsPages.notificationView.open(referenceNumber);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));
    await expect(certifiedForRow).toContainText('Exhibition');
  });

  test('Back from the reason for import opened by a Change link opens the review', async ({ animalsSeededJourney, animalsPages }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    await animalsPages.notificationView.changeLink('Change reason for import').click();
    await expect(animalsPages.importReason.heading).toBeVisible();

    await animalsPages.importReason.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('Save and continue on a page opened by a Change link goes on, and the review shows the changed answer', async ({
    animalsSeededJourney,
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    const purposeValue = animalsPages.notificationView.summaryValue(
      animalsPages.notificationView.summaryCard('Reason for import'),
      'Purpose in the market',
    );
    await expect(purposeValue).toContainText('Breeding');
    await animalsPages.notificationView.changeLink('Change reason for import').click();
    await expect(animalsPages.importReason.heading).toBeVisible();
    await animalsPages.importReason.purpose('Research').check();
    await expectSaveAndContinueWalk(
      pages.page,
      referenceNumber,
      [animalsPages.notificationView.slug],
      animalsJourney.saveAndContinueStopsFrom(animalsPages.importReason),
      animalsPages.notificationView,
    );
    await expect(purposeValue).toContainText('Research');
  });

  test('the contact address Change link opens the page on the review trail, and choosing another address and Save and continue returns to the review showing it', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    const contactAddressValue = animalsPages.notificationView.summaryValue(
      animalsPages.notificationView.summaryCard('Contact address for this consignment'),
      'Contact address',
    );
    await expect(contactAddressValue).toContainText(CONTACT_ADDRESS_NAME);

    await animalsPages.notificationView.changeLink(/^Change contact address/).click();
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.contactAddress, referenceNumber, animalsPages.notificationView.slug);
    await animalsPages.contactAddress.address(CONSIGNEE_NAME).check();
    await animalsPages.contactAddress.saveAndContinue.click();

    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(
      animalsPages.notificationView.expectedUrlPatternOnTrail(referenceNumber, [
        animalsPages.notificationView.slug,
        animalsPages.contactAddress.slug,
      ]),
    );
    await expect(contactAddressValue).toContainText(CONSIGNEE_NAME);
  });

  test('the documents Change link opens Upload documents on the review trail, and Save and continue walks each later page back to the review', async ({
    animalsSeededJourney,
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    await animalsPages.notificationView.changeLink('Change uploaded documents').click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.accompanyingDocuments, referenceNumber, animalsPages.notificationView.slug);
    await expectSaveAndContinueWalk(
      pages.page,
      referenceNumber,
      [animalsPages.notificationView.slug],
      animalsJourney.saveAndContinueStopsFrom(animalsPages.accompanyingDocuments),
      animalsPages.notificationView,
    );
  });

  test('the roles and addresses Change link opens a page whose Back link opens the review', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    await animalsPages.notificationView.changeLink('Change roles and addresses').click();
    await expect(animalsPages.addresses.heading).toBeVisible();
    await animalsPages.addresses.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('the documents Change link opens the page with a Back link to the review, which stays after a refusal, after Save and add another and after Remove', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    const reviewUrl = animalsPages.notificationView.expectedUrlPattern(referenceNumber);

    await animalsPages.notificationView.changeLink('Change uploaded documents').click();
    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
    await expectOpenFromReview(pages.page, animalsPages.accompanyingDocuments, referenceNumber, animalsPages.notificationView.slug);
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.documentReference.fill('GBHC1234567890');
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(animalsPages.accompanyingDocuments.errorSummary).toContainText('Upload a document');
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    const reference = `GBHC${Date.now()}`;
    await animalsPages.accompanyingDocuments.fillDocument(reference, DOCUMENT_ISSUE_DATE, fileUploadPaths.safeFile1kbPdf);
    await animalsPages.accompanyingDocuments.saveAndAddAnother.click();
    await expect(animalsPages.accompanyingDocuments.documentRow(reference)).toBeVisible();
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.removeDocument(1).click();
    await expect(animalsPages.accompanyingDocuments.linkBack).toHaveAttribute('href', reviewUrl);

    await animalsPages.accompanyingDocuments.linkBack.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });
});
