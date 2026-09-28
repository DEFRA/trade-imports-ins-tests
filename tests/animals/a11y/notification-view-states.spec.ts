import { SET_BASES } from '@page-objects/shared/sets';

import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the check your answers page has no accessibility violations in its DRAFT and SUBMITTED states, including the submission confirmation', async ({
    seededJourney,
    pages,
    animalsPages,
    runA11yScan,
  }) => {
    await test.step('Review your notification (draft)', async () => {
      const draftReference = await seededJourney.createDraftNotification('unlocked');
      await seededJourney.resumeInUi(draftReference, animalsPages.notificationView);
      await runA11yScan();
    });

    const submittedReference = await seededJourney.createSubmittedNotification();

    await test.step('Review your notification (submitted, read-only)', async () => {
      await seededJourney.resumeInUi(submittedReference, animalsPages.notificationView);
      await pages.page.getByRole('button', { name: 'Delete' }).waitFor();
      await runA11yScan();
    });

    await test.step('Import notification submitted (confirmation)', async () => {
      await animalsPages.notificationView.navigateToFrontend(`${SET_BASES.liveAnimals}/notifications/${submittedReference}/confirmation`);
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
      await runA11yScan();
    });
  });
});
