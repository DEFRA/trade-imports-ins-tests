import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { ObjectId } from 'mongodb';

test.describe(`Accessibility (admin) ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('each admin page has no accessibility violations when validation errors are shown', async ({
    animalsAdminNavigation,
    animalsAdminPages,
    runA11yScan,
  }) => {
    await test.step('Admin notifications delete with an unknown reference', async () => {
      await animalsAdminNavigation.toNotifications();
      const invalidReference = `EXIST.NON.2026.${new ObjectId().toString()}`;
      await animalsAdminPages.notifications.inputReferenceNumber.fill(invalidReference);
      await animalsAdminPages.notifications.deleteByReferenceNumber();
      await animalsAdminPages.notifications.btnConfirm.click();
      await runA11yScan();
    });
  });
});
