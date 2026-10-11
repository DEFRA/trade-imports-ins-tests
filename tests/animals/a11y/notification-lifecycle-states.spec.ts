import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the cancel-amendment and delete confirmation pages have no accessibility violations', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();
    const { journeyId } = journeyContext;

    await test.step('Cancel this amendment?', async () => {
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchForReference(journeyId);
      await animalsPages.dashboard.amend(journeyId).click();
      await animalsPages.overview.heading.waitFor();
      await animalsPages.notificationView.open(journeyId);
      await animalsPages.notificationView.cancelAmend.click();
      await animalsPages.notificationCancelAmend.heading.waitFor();
      await runA11yScan();
      // ?cancelled=1 rather than the view's heading, which the error page also has.
      await animalsPages.notificationCancelAmend.confirm.click();
      await pages.page.waitForURL(/\/notification-view\?cancelled=1$/);
    });

    await test.step('Delete this notification?', async () => {
      await animalsPages.dashboard.open();
      await animalsPages.dashboard.searchFor(journeyId);
      await animalsPages.dashboard.delete(journeyId).click();
      await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
      await runA11yScan();
    });
  });
});
