import { test, expect } from '@fixtures';

test.describe('Declaration page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ seededJourney, animalsPages }) => {
    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, animalsPages.declaration);
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.declaration.heading).toBeVisible();
    await expect(animalsPages.declaration.confirmation).toBeVisible();
    await expect(animalsPages.declaration.continueButton).toBeVisible();
  });

  test('shows an error summary when submitted unconfirmed', async ({ pages, animalsPages }) => {
    await animalsPages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
