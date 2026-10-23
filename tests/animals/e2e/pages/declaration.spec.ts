import { test, expect } from '@fixtures';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { todayOrTomorrowServiceDisplayDatePattern } from '@utils/date-utils';

test.describe('Declaration page', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('for a draft', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsJourney }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsJourney.toDeclarationOfCurrentNotification();
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

    test('shows the confirmation as a small checkbox in a group whose legend is hidden from sight', async ({ animalsPages }) => {
      const { content } = animalsPages.declaration;

      await expect(content.confirmationGroup).toBeVisible();
      await expect(content.confirmationLegend).toHaveClass(/govuk-visually-hidden/);
      await expect(content.checkboxes).toHaveClass(/govuk-checkboxes--small/);
    });

    test('shows the date of declaration in bold', async ({ animalsPages }) => {
      const { dateValue } = animalsPages.declaration.content;

      await expect(dateValue).toHaveText(new RegExp(`^${todayOrTomorrowServiceDisplayDatePattern()}$`));
      await expect(dateValue).toHaveCSS('font-weight', '700');
    });
  });

  for (const { state, seed } of [
    { state: 'a draft', seed: (journey: AnimalsSeededJourney) => journey.createDraftNotification() },
    { state: 'an amendment', seed: (journey: AnimalsSeededJourney) => journey.createAmendNotification() },
  ]) {
    test(`starts the declaration of ${state} with the Declaration heading`, async ({
      animalsSeededJourney,
      animalsJourney,
      animalsPages,
    }) => {
      await seed(animalsSeededJourney);
      await animalsJourney.toDeclarationOfCurrentNotification();

      await expect(animalsPages.declaration.content.firstContentElement).toHaveText('Declaration');
    });
  }
});
