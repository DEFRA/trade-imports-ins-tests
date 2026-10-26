import { test, expect } from '@fixtures';

const CUSTOMS_ENQUIRIES_HREF =
  'https://www.gov.uk/government/organisations/hm-revenue-customs/contact/customs-international-trade-and-excise-enquiries';
const CALL_CHARGES_HREF = 'https://www.gov.uk/call-charges';

test.describe('Import notification submitted page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.confirmation);
  });

  test('lists the ITAHC as still to upload when no document was uploaded', async ({ animalsPages }) => {
    await expect(animalsPages.confirmation.outstandingItems).toHaveText(['upload the ITAHC and any other required documents']);
  });

  test('says the notification can be viewed or changed from the dashboard', async ({ animalsPages }) => {
    await expect(animalsPages.confirmation.viewOrChangeSentence).toHaveText(
      'You can view or change this notification from your dashboard.',
    );
  });

  test('opens the contact HMRC link in a new tab and says so', async ({ animalsPages }) => {
    const link = animalsPages.confirmation.contactHmrcLink;

    await expect(link).toHaveAttribute('href', CUSTOMS_ENQUIRIES_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  test('opens the call charges link in a new tab and says so', async ({ animalsPages }) => {
    const link = animalsPages.confirmation.callChargesLink;

    await expect(link).toHaveAttribute('href', CALL_CHARGES_HREF);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });
});
