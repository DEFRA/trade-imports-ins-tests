import { test, expect } from '@fixtures';
import { withOutbox } from '@flows/animals/outbox';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMISSION_DELETED = 'uk.gov.defra.imports.notification.NotificationSubmissionDeleted';
const shortType = (eventType: string): string => eventType.split('.').pop() ?? eventType;

test.describe('Seeded notification transitions', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test(
    'carries an actor and a populated event through submit, amend and cancel',
    { tag: '@animals-frontend' },
    async ({ animalsSeededJourney }) => {
      test.slow();
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
      await animalsSeededJourney.amend(referenceNumber);
      await animalsSeededJourney.cancelAmend(referenceNumber);

      await withOutbox(async (outbox) => {
        await expect
          .poll(
            async () =>
              (await outbox.eventsOf(referenceNumber))
                .map((event) => shortType(event.eventType))
                .filter((type) => type !== 'NotificationEdited'),
            { timeout: timeouts.long },
          )
          .toEqual(['NotificationCreated', 'NotificationSubmitted', 'NotificationAmendmentRequested', 'NotificationAmendmentCancelled']);

        const writtenEvents = await outbox.eventsOf(referenceNumber);
        for (const event of writtenEvents) {
          expect(event.actor?.organisationId, `${shortType(event.eventType)} carries no actor`).toBeTruthy();
        }

        const submitted = writtenEvents.find((event) => shortType(event.eventType) === 'NotificationSubmitted');
        const consignment = submitted?.data.specifiedConsignment;
        expect(consignment?.consignorParty).toBeTruthy();
        expect(consignment?.consigneeParty).toBeTruthy();
        expect(consignment?.originCountry).toBeTruthy();
        expect(consignment?.unloadingBaseportLocation).toBeTruthy();
        expect(consignment?.includedConsignmentItem?.length).toBeGreaterThan(0);
      });
    },
  );

  test('soft-deletes a submitted notification through the frontend', async ({ animalsSeededJourney }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();
    await animalsSeededJourney.softDelete(referenceNumber);

    const deletion = await withOutbox((outbox) => outbox.singleEventOf(referenceNumber, NOTIFICATION_SUBMISSION_DELETED));
    expect(deletion.actor?.organisationId).toBeTruthy();
  });
});
