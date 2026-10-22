import { test, expect } from '@fixtures';

const COMMERCIAL_TRANSPORTER = 'García Livestock Transport SL';
const PRIVATE_TRANSPORTER = 'Aberdeen Livestock Ltd';

type MarkedWindow = Window & { __noReloadMarker?: boolean };

test.describe('Transporter list page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toTransporter();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.heading).toBeVisible();
    await expect(animalsPages.transporter.addTransporter).toBeVisible();
    await expect(animalsPages.transporter.saveAndContinue).toBeVisible();
  });

  test('lists both a commercial and a private transporter', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER)).toBeVisible();
    await expect(animalsPages.transporter.transporter(PRIVATE_TRANSPORTER)).toBeVisible();
  });

  test('leaves every transporter unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER)).not.toBeChecked();
    await expect(animalsPages.transporter.transporter(PRIVATE_TRANSPORTER)).not.toBeChecked();
  });

  test('accepts a transporter picked from the list', async ({ pages, animalsPages }) => {
    await animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER).check();
    await animalsPages.transporter.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('narrows the listed transporters to the match as the trader types, with no new page', async ({ pages, animalsPages }) => {
    await pages.page.evaluate(() => {
      (window as MarkedWindow).__noReloadMarker = true;
    });

    await animalsPages.transporter.searchBox.fill('garcia');

    await expect(animalsPages.transporter.listedTransporters).toHaveCount(1);
    await expect(animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER)).toBeVisible();
    expect(await pages.page.evaluate(() => (window as MarkedWindow).__noReloadMarker)).toBe(true);
  });

  test('saves a transporter ticked before the list was filtered to hide it', async ({ animalsPages }) => {
    await animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER).check();

    await animalsPages.transporter.searchBox.fill('aberdeen');
    await expect(animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER)).toBeHidden();
    await animalsPages.transporter.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Transport details').click();
    await expect(animalsPages.transporter.heading).toBeVisible();
    await expect(animalsPages.transporter.transporter(COMMERCIAL_TRANSPORTER)).toBeChecked();
  });

  test('puts Add a transporter before the table', async ({ animalsPages }) => {
    const addBox = await animalsPages.transporter.addTransporter.boundingBox();
    const tableBox = await animalsPages.transporter.table.boundingBox();

    expect(addBox.y).toBeLessThan(tableBox.y);
  });

  test('Add a transporter opens the transporter type question', async ({ animalsPages }) => {
    await animalsPages.transporter.addTransporter.click();

    await expect(animalsPages.transporterAdd.heading).toBeVisible();
  });
});

test.describe('Transporter list search without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test('narrows the list on the server when the Search button is pressed', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toTransporter();

    await animalsPages.transporter.searchBox.fill('aberdeen');
    await animalsPages.transporter.searchButton.click();

    await expect(animalsPages.transporter.listedTransporters).toHaveCount(1);
    await expect(animalsPages.transporter.transporter(PRIVATE_TRANSPORTER)).toBeVisible();
    await expect(animalsPages.transporter.searchBox).toHaveValue('aberdeen');
  });
});
