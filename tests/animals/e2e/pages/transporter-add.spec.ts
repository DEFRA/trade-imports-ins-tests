import { test, expect } from '@fixtures';

// The type question is asked only of a trader who could not find their
// transporter on the list, so it is reached through "Add a transporter".
test.describe('Transporter type page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey, pages }) => {
    await journey.toTransporter();
    await pages.transporter.addTransporter.click();
    await pages.transporterAdd.heading.waitFor();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.transporterAdd.heading).toBeVisible();
    await expect(pages.transporterAdd.transporterType('Commercial')).toBeVisible();
    await expect(pages.transporterAdd.transporterType('Private')).toBeVisible();
    await expect(pages.transporterAdd.saveAndContinue).toBeVisible();
  });

  test('leaves the transporter type unchecked on load', async ({ pages }) => {
    await expect(pages.transporterAdd.transporterType('Commercial')).not.toBeChecked();
  });

  test('accepts a valid transporter type', async ({ pages }) => {
    await pages.transporterAdd.transporterType('Commercial').check();
    await pages.transporterAdd.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    // The commercial arm is the add-commercial form: a trader who could not
    // find their transporter on the list types it in rather than picking again.
    await expect(pages.commercialTransporter.heading).toBeVisible();
  });
});
