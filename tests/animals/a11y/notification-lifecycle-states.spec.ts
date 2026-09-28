import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the cancel-amendment and delete confirmation pages have no accessibility violations', async ({
    journey,
    journeyContext,
    pages,
    runA11yScan,
  }) => {
    test.slow();
    await journey.submitNotification();
    const { journeyId } = journeyContext;

    await test.step('Cancel this amendment?', async () => {
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(journeyId);
      await pages.notificationDashboard.amend(journeyId).click();
      await pages.overview.heading.waitFor();
      await pages.notificationView.open(journeyId);
      await pages.notificationView.cancelAmendment.click();
      await pages.notificationCancelAmend.heading.waitFor();
      await runA11yScan();
      // ?cancelled=1 rather than the view's heading, which the error page also has.
      await pages.notificationCancelAmend.confirm.click();
      await pages.page.waitForURL(/\/notification-view\?cancelled=1$/);
    });

    await test.step('Delete this notification?', async () => {
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchFor(journeyId);
      await pages.notificationDashboard.delete(journeyId).click();
      await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
      await runA11yScan();
    });
  });
});
