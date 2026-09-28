import { test, expect } from '@fixtures';

test.describe('Declaration page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ seededJourney, pages }) => {
    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, pages.declaration);
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.confirmation).toBeVisible();
    await expect(pages.declaration.continueButton).toBeVisible();
  });

  test('shows an error summary when submitted unconfirmed', async ({ pages }) => {
    await pages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
