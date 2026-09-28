import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { defaultUser } from '@config/users';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { ObjectId } from 'mongodb';
import { skipIfCdpEnvironment, isComposeEnvironment } from '@utils/playwright/environment';

const DELETE_SUCCESS_MESSAGE = 'Notifications deleted successfully. Redirecting in 3 seconds...';
const DELETE_FAILURE_MESSAGE = 'There was a problem deleting the notifications. Please try again.';
const AUDIT_DATABASE = 'trade-imports-animals-backend';
const AUDIT_COLLECTION = 'audit';
const COMPOSE_ONLY_SKIP_REASON = 'persistence checked only in the docker compose stack';
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const AUDIT_TIMESTAMP_PATTERN = /\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/;

test.describe('Notifications (admin)', { tag: ['@integration', '@mongodb'] }, () => {
  test.describe.configure({ mode: 'default' });

  test(
    'finds and deletes a submitted notification by reference number',
    { tag: '@smoke' },
    async ({ animalsSeededJourney, animalsAdminNavigation, animalsAdminPages }) => {
      test.slow();
      const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

      await animalsAdminNavigation.toNotifications();
      await animalsAdminPages.notifications.findRowByReference(referenceNumber);
      await expect(animalsAdminPages.notifications.tableRowByReference(referenceNumber)).toBeVisible();

      await animalsAdminPages.notifications.inputReferenceNumber.fill(referenceNumber);
      await animalsAdminPages.notifications.deleteByReferenceNumber();
      await animalsAdminPages.notifications.btnConfirm.click();
      await expect(animalsAdminPages.notifications.alertSuccess).toContainText(DELETE_SUCCESS_MESSAGE);

      await expect
        .poll(async () => animalsAdminPages.notifications.tableRowByReference(referenceNumber).isVisible(), {
          timeout: timeouts.medium,
        })
        .toBe(false);
    },
  );

  test('cancelling checkbox deletion keeps the notification visible', async ({
    animalsSeededJourney,
    animalsAdminNavigation,
    animalsAdminPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

    await animalsAdminNavigation.toNotifications();
    await animalsAdminPages.notifications.findRowByReference(referenceNumber);
    await animalsAdminPages.notifications.checkboxNotificationByReference(referenceNumber).check();
    await animalsAdminPages.notifications.btnDelete.click();
    await animalsAdminPages.notifications.btnCancel.click();
    await expect(animalsAdminPages.notifications.tableRowByReference(referenceNumber)).toBeVisible();
  });

  test('deletes a notification by checkbox', async ({ animalsSeededJourney, animalsAdminNavigation, animalsAdminPages }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createSubmittedNotification();

    await animalsAdminNavigation.toNotifications();

    await test.step('delete notification by checkbox', async () => {
      await animalsAdminPages.notifications.findRowByReference(referenceNumber);
      await animalsAdminPages.notifications.checkboxNotificationByReference(referenceNumber).check();
      await animalsAdminPages.notifications.btnDelete.click();
      await animalsAdminPages.notifications.btnConfirm.click();
      await expect(animalsAdminPages.notifications.alertSuccess).toContainText(DELETE_SUCCESS_MESSAGE);
      await expect
        .poll(async () => animalsAdminPages.notifications.tableRowByReference(referenceNumber).isVisible(), {
          timeout: timeouts.medium,
        })
        .toBe(false);
    });

    await test.step('writes a successful delete audit record for one notification delete', async (step) => {
      step.skip(!isComposeEnvironment(), COMPOSE_ONLY_SKIP_REASON);

      const client = new MongoDbClient();

      try {
        await client.connect();
        const auditCollection = client.collection(AUDIT_DATABASE, AUDIT_COLLECTION);
        const auditRecords = await auditCollection.find({ notificationReferenceNumbers: referenceNumber }).toArray();

        expect(auditRecords).toHaveLength(1);
        const [auditRecord] = auditRecords;
        expect(String(auditRecord._id)).toMatch(OBJECT_ID_PATTERN);
        expect(auditRecord.action).toBe('DELETE_NOTIFICATIONS');
        expect(auditRecord.result).toBe('SUCCESS');
        expect(String(auditRecord.timestamp)).toMatch(AUDIT_TIMESTAMP_PATTERN);
        expect(auditRecord.numberOfNotifications).toBe(1);
        expect(auditRecord.notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(auditRecord.traceId).toBe('test-trace-id');
        expect(auditRecord.userId).toBe(defaultUser.crn);
      } finally {
        await client.close();
      }
    });
  });

  test.skip(
    'deletes all current-page notifications by select all',
    { tag: '@compose' },
    async ({ animalsSeededJourney, animalsAdminNavigation, animalsAdminPages }) => {
      skipIfCdpEnvironment('Compose/local only: destructive (deletes the current page of notifications).');
      test.slow();

      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsSeededJourney.createDraftNotification('unlocked');

      await animalsAdminNavigation.toNotifications();
      await expect(animalsAdminPages.notifications.heading).toBeVisible();

      const currentPageReferences = await animalsAdminPages.notifications.currentPageReferences();
      const expectedDeleteCount = currentPageReferences.length;
      expect(currentPageReferences.length).toBeGreaterThan(0);
      const pageOneReference = currentPageReferences[0];

      await test.step('select all deletes only the current page', async () => {
        await animalsAdminPages.notifications.checkBoxSelectAll.check();
        await animalsAdminPages.notifications.btnDelete.click();
        await animalsAdminPages.notifications.btnConfirm.click();
        await expect(animalsAdminPages.notifications.alertSuccess).toContainText(DELETE_SUCCESS_MESSAGE);
      });

      await test.step('writes a successful delete audit record covering a page-1 reference', async () => {
        const client = new MongoDbClient();

        try {
          await client.connect();
          const auditCollection = client.collection(AUDIT_DATABASE, AUDIT_COLLECTION);
          const auditRecords = await auditCollection
            .find({ action: 'DELETE_NOTIFICATIONS', notificationReferenceNumbers: pageOneReference })
            .toArray();

          expect(auditRecords).toHaveLength(1);
          const [auditRecord] = auditRecords;
          expect(String(auditRecord._id)).toMatch(OBJECT_ID_PATTERN);
          expect(auditRecord.action).toBe('DELETE_NOTIFICATIONS');
          expect(auditRecord.result).toBe('SUCCESS');
          expect(String(auditRecord.timestamp)).toMatch(AUDIT_TIMESTAMP_PATTERN);
          expect(auditRecord.numberOfNotifications).toBe(expectedDeleteCount);
          expect(auditRecord.notificationReferenceNumbers).toContain(pageOneReference);
          expect(auditRecord.traceId).toBe('test-trace-id');
          expect(auditRecord.userId).toBe(defaultUser.crn);
        } finally {
          await client.close();
        }
      });
    },
  );

  test('does not allow deleting a notification by invalid reference number', async ({ animalsAdminNavigation, animalsAdminPages }) => {
    test.slow();
    const randomId = new ObjectId().toString();
    const invalidReference = `EXIST.NON.2026.${randomId}`;

    await animalsAdminNavigation.toNotifications();

    await test.step('attempt delete by invalid reference number shows an error', async () => {
      await animalsAdminPages.notifications.inputReferenceNumber.fill(invalidReference);
      await animalsAdminPages.notifications.deleteByReferenceNumber();
      await animalsAdminPages.notifications.btnConfirm.click();
      await expect(animalsAdminPages.notifications.alertImportant).toContainText(DELETE_FAILURE_MESSAGE);
    });

    await test.step('writes a failed delete audit record for one notification delete', async (step) => {
      step.skip(!isComposeEnvironment(), COMPOSE_ONLY_SKIP_REASON);

      const client = new MongoDbClient();

      try {
        await client.connect();
        const auditCollection = client.collection(AUDIT_DATABASE, AUDIT_COLLECTION);
        const auditRecords = await auditCollection.find({ notificationReferenceNumbers: invalidReference }).toArray();

        expect(auditRecords).toHaveLength(1);
        const [auditRecord] = auditRecords;
        expect(String(auditRecord._id)).toMatch(OBJECT_ID_PATTERN);
        expect(auditRecord.action).toBe('DELETE_NOTIFICATIONS');
        expect(auditRecord.result).toBe('FAILURE');
        expect(String(auditRecord.timestamp)).toMatch(AUDIT_TIMESTAMP_PATTERN);
        expect(auditRecord.numberOfNotifications).toBe(1);
        expect(auditRecord.notificationReferenceNumbers).toEqual([invalidReference]);
        expect(auditRecord.traceId).toBe('test-trace-id');
        expect(auditRecord.userId).toBe(defaultUser.crn);
      } finally {
        await client.close();
      }
    });
  });
});
