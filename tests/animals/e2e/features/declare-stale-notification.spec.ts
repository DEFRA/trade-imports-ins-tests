import { test, expect } from '@fixtures';
import { CREATE_PATH } from '@flows/animals/seeded-journey';

const EDITED_REFERENCE = 'Edited456GB';

// The frontend's fit specs and the backend's integration tests already prove these refusals in isolation;
// these run the same journeys against the real frontend, backend and database together.
test.describe('A notification that changed after the trader last saw it', () => {
  test('check your answers: when changed since it rendered, Continue returns to it with the current content', async ({
    animalsSeededJourney,
    frontendForms,
    pages,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    // Another tab, or another user, edits the notification after check your answers rendered.
    await frontendForms.postForm(`${CREATE_PATH}/${referenceNumber}/origin`, {
      countryOfOrigin: 'FR',
      regionOfOriginCodeRequirement: 'yes',
      regionOfOriginCodeSuffix: '75',
      internalReferenceNumber: EDITED_REFERENCE,
    });
    await animalsPages.notificationView.continueButton.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?staleAction=1$/);
    await expect(pages.page.getByText('The notification has been updated')).toBeVisible();
    await expect(pages.page.getByText(EDITED_REFERENCE)).toBeVisible();
  });

  test('declaration: when changed since it rendered, Submit returns to check your answers with the current content', async ({
    animalsSeededJourney,
    frontendForms,
    pages,
    animalsPages,
  }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();

    // Another tab, or another user, edits the notification after the declaration rendered.
    await frontendForms.postForm(`${CREATE_PATH}/${referenceNumber}/origin`, {
      countryOfOrigin: 'FR',
      regionOfOriginCodeRequirement: 'yes',
      regionOfOriginCodeSuffix: '75',
      internalReferenceNumber: EDITED_REFERENCE,
    });
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?staleAction=1$/);
    await expect(pages.page.getByText('The notification has been updated')).toBeVisible();
    await expect(pages.page.getByText(EDITED_REFERENCE)).toBeVisible();
  });
});
