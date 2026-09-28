import { test, expect } from '@fixtures';

test.describe('Transporter list page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toTransporter();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.heading).toBeVisible();
    await expect(animalsPages.transporter.addTransporter).toBeVisible();
    await expect(animalsPages.transporter.saveAndContinue).toBeVisible();
  });

  // Both kinds on the one list is the point of the page: a trader whose
  // transporter is private has a row to pick rather than a form to fill.
  test('lists both a commercial and a private transporter', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.transporter('García Livestock Transport SL')).toBeVisible();
    await expect(animalsPages.transporter.transporter('Aberdeen Livestock Ltd')).toBeVisible();
  });

  test('leaves every transporter unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.transporter('García Livestock Transport SL')).not.toBeChecked();
    await expect(animalsPages.transporter.transporter('Aberdeen Livestock Ltd')).not.toBeChecked();
  });

  test('accepts a transporter picked from the list', async ({ pages, animalsPages }) => {
    await animalsPages.transporter.transporter('García Livestock Transport SL').check();
    await animalsPages.transporter.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();
  });
});
