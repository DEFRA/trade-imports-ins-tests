import { test, expect } from '@fixtures';

test.describe('Transporter list page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toTransporter();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.transporter.addTransporter).toBeVisible();
    await expect(pages.transporter.saveAndContinue).toBeVisible();
  });

  // Both kinds on the one list is the point of the page: a trader whose
  // transporter is private has a row to pick rather than a form to fill.
  test('lists both a commercial and a private transporter', async ({ pages }) => {
    await expect(pages.transporter.transporter('García Livestock Transport SL')).toBeVisible();
    await expect(pages.transporter.transporter('Aberdeen Livestock Ltd')).toBeVisible();
  });

  test('leaves every transporter unchecked on load', async ({ pages }) => {
    await expect(pages.transporter.transporter('García Livestock Transport SL')).not.toBeChecked();
    await expect(pages.transporter.transporter('Aberdeen Livestock Ltd')).not.toBeChecked();
  });

  test('accepts a transporter picked from the list', async ({ pages }) => {
    await pages.transporter.transporter('García Livestock Transport SL').check();
    await pages.transporter.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(pages.overview.heading).toBeVisible();
  });
});
