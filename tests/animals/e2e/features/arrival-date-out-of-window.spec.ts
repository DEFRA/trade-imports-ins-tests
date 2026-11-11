import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { getRelativeAppDateText, parseAppDateText, toIsoDate } from '@utils/date-utils';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const ARRIVAL_DETAILS_TASK = 'Arrival details';
const ARRIVAL_DATE_NO_LONGER_IN_WINDOW = 'The saved arrival date is no longer a date you can choose. Enter a new arrival date.';

const ARRIVAL_DATE_OBLIGATION_ID = '12b3c4d5-e6f7-4a08-8b9a-1c2d3e4f5a6b';

const storeArrivalDate = async (referenceNumber: string, daysAgo: number): Promise<void> => {
  const arrivalDateText = getRelativeAppDateText({ dayOffset: -daysAgo });
  const client = new MongoDbClient();
  try {
    await client.connect();
    const notifications = client.collection('trade-imports-animals-backend', 'notification');
    const { modifiedCount } = await notifications.updateOne(
      { referenceNumber, 'fulfilments.obligationId': ARRIVAL_DATE_OBLIGATION_ID },
      {
        $set: {
          'fulfilments.$.value': parseAppDateText(arrivalDateText),
          'notification.transport.arrivalDate': toIsoDate(parseAppDateText(arrivalDateText)),
        },
      },
    );
    expect(modifiedCount).toBe(1);
  } finally {
    await client.close();
  }
};

test.describe('A saved arrival date measured against the window when it is read', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the saved arrival date is moved in Mongo, which only the compose stack exposes');
  });

  test('Overview reads Arrival details To do once the saved arrival date is more than 7 days in the past', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await storeArrivalDate(referenceNumber, 8);

    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK)).toHaveText('To do');
  });

  test('Overview still reads Arrival details Complete when the saved arrival date is exactly 7 days in the past', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await storeArrivalDate(referenceNumber, 7);

    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK)).toHaveText('Complete');
  });

  test('reopening arrival details names a saved arrival date that has fallen out of the window', async ({
    animalsSeededJourney,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await storeArrivalDate(referenceNumber, 8);

    await animalsPages.arrivalDetails.open(referenceNumber);

    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummaryLink(ARRIVAL_DATE_NO_LONGER_IN_WINDOW)).toBeVisible();
  });
});
