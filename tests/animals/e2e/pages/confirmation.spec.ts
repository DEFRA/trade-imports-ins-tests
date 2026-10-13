import { test, expect } from '@fixtures';
import { commercialInvoiceDocument } from '@domain/animals/fixtures/seeded-journey';

test.describe('Import notification submitted page', () => {
  test('a notification not yet submitted goes by its declaration to the review it must pass first', async ({
    pages,
    animalsSeededJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    await animalsPages.confirmation.open(referenceNumber);

    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrl(referenceNumber));
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('submitted with no document: asks for the ITAHC and tells the trader they can view or change it from the dashboard', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

    await animalsPages.confirmation.open(referenceNumber);

    await expect(animalsPages.confirmation.heading).toBeVisible();
    await expect(animalsPages.confirmation.outstandingHeading).toBeVisible();
    await expect(animalsPages.confirmation.outstandingDocuments).toHaveCount(1);
    await expect(animalsPages.confirmation.viewOrAmendBody).toBeVisible();
  });

  test('submitted with only a commercial invoice: still asks for the ITAHC', async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotificationWithDocument(commercialInvoiceDocument);

    await animalsPages.confirmation.open(referenceNumber);

    await expect(animalsPages.confirmation.outstandingDocuments).toHaveCount(1);
  });

  test('submitted with an ITAHC: asks for nothing more', async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotificationWithHealthCertificate();

    await animalsPages.confirmation.open(referenceNumber);

    await expect(animalsPages.confirmation.heading).toBeVisible();
    await expect(animalsPages.confirmation.outstandingHeading).toHaveCount(0);
    await expect(animalsPages.confirmation.outstandingDocuments).toHaveCount(0);
  });

  test('the HMRC links open in a new tab', async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotificationWithHealthCertificate();

    await animalsPages.confirmation.open(referenceNumber);

    for (const link of [animalsPages.confirmation.contactHmrc, animalsPages.confirmation.callCharges]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    }
    await expect(animalsPages.confirmation.contactHmrc).toHaveAttribute(
      'href',
      'https://www.gov.uk/government/organisations/hm-revenue-customs/contact/customs-international-trade-and-excise-enquiries',
    );
    await expect(animalsPages.confirmation.callCharges).toHaveAttribute('href', 'https://www.gov.uk/call-charges');
  });
});
