import { test, expect } from '@fixtures';

// The type question is asked only of a trader who could not find their
// transporter on the list, so it is reached through "Add a transporter".
test.describe('Transporter type page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey, animalsPages }) => {
    await journey.toTransporter();
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.transporterAdd.heading).toBeVisible();
    await expect(animalsPages.transporterAdd.transporterType('Commercial')).toBeVisible();
    await expect(animalsPages.transporterAdd.transporterType('Private')).toBeVisible();
    await expect(animalsPages.transporterAdd.saveAndContinue).toBeVisible();
  });

  test('leaves the transporter type unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.transporterAdd.transporterType('Commercial')).not.toBeChecked();
  });

  test('accepts a valid transporter type', async ({ pages, animalsPages }) => {
    await animalsPages.transporterAdd.transporterType('Commercial').check();
    await animalsPages.transporterAdd.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    // The commercial arm is the add-commercial form: a trader who could not
    // find their transporter on the list types it in rather than picking again.
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
  });
});
