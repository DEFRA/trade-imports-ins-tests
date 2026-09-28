import { test, expect } from '@fixtures';

// The approved commercial register. Nothing links to it now that the add
// route's commercial arm is the add-commercial form and the transporter list
// carries the register's rows itself, so the journey helper reaches it by its
// own URL — through the add route, which is what answers the transporter type.
test.describe('Transporter selection page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransporterSelection();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.transporterSelection.heading).toBeVisible();
    await expect(animalsPages.transporterSelection.transporter('García Livestock Transport SL')).toBeVisible();
    await expect(animalsPages.transporterSelection.saveAndContinue).toBeVisible();
  });

  test('leaves the transporter unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.transporterSelection.transporter('García Livestock Transport SL')).not.toBeChecked();
  });

  test('accepts a valid transporter', async ({ pages, animalsPages }) => {
    await animalsPages.transporterSelection.transporter('García Livestock Transport SL').check();
    await animalsPages.transporterSelection.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
