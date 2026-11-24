import { test, expect } from '@fixtures';
import { ALL_ANSWERS, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';

const CUSTOMS_ENQUIRIES_HREF =
  'https://www.gov.uk/government/organisations/hm-revenue-customs/contact/customs-international-trade-and-excise-enquiries';
const CALL_CHARGES_HREF = 'https://www.gov.uk/call-charges';
const ITAHC_STILL_TO_UPLOAD = ['upload the ITAHC and any other required documents'];
const IDENTIFIER_STILL_TO_COMPLETE = ['complete the animal identifier information in the notification'];

test.describe('Import notification submitted page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.confirmation);
  });

  test(
    'lists the ITAHC as still to upload when no document was uploaded',
    { tag: ['@cross-browser', '@ios'] },
    async ({ animalsPages }) => {
      await expect(animalsPages.confirmation.outstandingItems).toHaveText(ITAHC_STILL_TO_UPLOAD);
    },
  );

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

test.describe('Import notification submitted page for a notification not yet submitted', { tag: '@duplicated-in-frontend' }, () => {
  test('sends a draft through its declaration to its review page', async ({ animalsSeededJourney, animalsPages, pages }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    const declarationRequest = pages.page.waitForRequest(animalsPages.declaration.expectedUrlPattern(referenceNumber));

    await animalsPages.confirmation.open(referenceNumber);
    await declarationRequest;

    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));
    await animalsPages.notificationView.viewHeader.expectDraftReview(referenceNumber);
  });
});

test.describe('Import notification submitted page after an ITAHC was uploaded', { tag: '@duplicated-in-frontend' }, () => {
  test('shows only the transporting, view or amend and help sections once an ITAHC is uploaded', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedWithItahcUploadedInUi(animalsPages);

    await animalsPages.confirmation.open(referenceNumber);

    await expect(animalsPages.confirmation.sectionHeadings).toHaveText([
      'Transporting the consignment',
      'How to view or amend this notification',
      'Getting help',
    ]);
  });
});

test.describe('Import notification submitted page after a document other than the ITAHC was uploaded', () => {
  test('lists the ITAHC as still to upload when only a veterinary health certificate was uploaded', async ({
    animalsJourney,
    animalsPages,
  }) => {
    test.slow();
    await animalsJourney.submitNotification(ALL_ANSWERS);

    await expect(animalsPages.confirmation.outstandingItems).toHaveText(ITAHC_STILL_TO_UPLOAD);
  });
});

const IDENTIFIERS_INCOMPLETE_CASES = [
  {
    title: 'lists the identifier item after the ITAHC when a line holds fewer identified animals than it declares',
    commodityLines: [{ ...MANDATORY_COMMODITY_LINES.cattle, noOfAnimals: 2 }],
  },
  {
    title: 'lists the identifier item after the ITAHC when a single-animal line has no identifier saved',
    commodityLines: [{ species: MANDATORY_COMMODITY_LINES.cattle.species, noOfAnimals: 1 }],
  },
];

test.describe('Import notification submitted page with animal identifiers incomplete', () => {
  for (const { title, commodityLines } of IDENTIFIERS_INCOMPLETE_CASES) {
    test(title, async ({ animalsSeededJourney, animalsPages }) => {
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification({ ...MANDATORY_ANSWERS, commodityLines });
      await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.confirmation);

      await expect(animalsPages.confirmation.outstandingItems).toHaveText([...ITAHC_STILL_TO_UPLOAD, ...IDENTIFIER_STILL_TO_COMPLETE]);
    });
  }
});
