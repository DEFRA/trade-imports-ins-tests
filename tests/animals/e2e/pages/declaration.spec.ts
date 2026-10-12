import { test, expect } from '@fixtures';

test.describe('Declaration page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsSeededJourney, animalsPages }) => {
    const referenceNumber = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.declaration);
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.declaration.heading).toBeVisible();
    await expect(animalsPages.declaration.confirmation).toBeVisible();
    await expect(animalsPages.declaration.continueButton).toBeVisible();
  });

  test('confirms with a small checkbox under a hidden legend and shows no status bar', async ({ animalsPages }) => {
    await expect(animalsPages.declaration.confirmationGroup).toBeVisible();
    await expect(animalsPages.declaration.confirmationLegend).toHaveClass(/govuk-visually-hidden/);
    await expect(animalsPages.declaration.confirmationCheckboxes).toHaveClass(/govuk-checkboxes--small/);
    await expect(animalsPages.declaration.journeyStrip).toHaveCount(0);
  });

  test('shows an error summary when submitted unconfirmed', async ({ pages, animalsPages }) => {
    await animalsPages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
