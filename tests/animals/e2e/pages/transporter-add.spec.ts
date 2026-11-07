import { test, expect } from '@fixtures';
import { type AnimalsPages } from '@page-objects';

async function choosePrivateTransporterAndGetReference(animalsPages: AnimalsPages): Promise<string> {
  await animalsPages.transporterAdd.transporterType('Private').check();
  await animalsPages.transporterAdd.continueButton.click();
  await animalsPages.privateTransporter.heading.waitFor();
  return animalsPages.privateTransporter.referenceNumberFromUrl();
}

test.describe('Transporter type page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toTransporter();
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.transporterAdd.heading).toBeVisible();
    await expect(animalsPages.transporterAdd.transporterType('Commercial')).toBeVisible();
    await expect(animalsPages.transporterAdd.transporterType('Private')).toBeVisible();
    await expect(animalsPages.transporterAdd.warning).toBeVisible();
    await expect(animalsPages.transporterAdd.continueButton).toBeVisible();
  });

  test('leaves the transporter type unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.transporterAdd.transporterType('Commercial')).not.toBeChecked();
  });

  test('accepts a valid transporter type', async ({ pages, animalsPages }) => {
    await animalsPages.transporterAdd.transporterType('Commercial').check();
    await animalsPages.transporterAdd.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.commercialTransporter.heading).toBeVisible();
  });

  test('refuses continuing with nothing chosen, and keeps a previously chosen type on a later visit', async ({ pages, animalsPages }) => {
    const referenceNumber = await choosePrivateTransporterAndGetReference(animalsPages);

    await animalsPages.transporterAdd.open(referenceNumber);
    await expect(animalsPages.transporterAdd.transporterType('Private')).toBeChecked();

    await animalsPages.transporter.open(referenceNumber);
    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
    await animalsPages.transporterAdd.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(animalsPages.transporterAdd.errorSummaryLink('Select a transporter type')).toBeVisible();
    await expect(animalsPages.transporterAdd.radiosError('Choose a transporter type')).toHaveText('Error: Select a transporter type');

    await animalsPages.transporterAdd.open(referenceNumber);
    await expect(animalsPages.transporterAdd.transporterType('Private')).toBeChecked();
  });

  test('redirects the private form to the type question when no type has been chosen', async ({ animalsPages }) => {
    const referenceNumber = animalsPages.transporterAdd.referenceNumberFromUrl();

    await animalsPages.privateTransporter.open(referenceNumber);

    await expect(animalsPages.transporterAdd.heading).toBeVisible();
  });

  test('redirects the commercial form to the type question when the private type was chosen', async ({ animalsPages }) => {
    const referenceNumber = await choosePrivateTransporterAndGetReference(animalsPages);

    await animalsPages.commercialTransporter.open(referenceNumber);

    await expect(animalsPages.transporterAdd.heading).toBeVisible();
  });

  test('shows the status strip on the list and the commercial form, and none on the type question or the private form', async ({
    animalsPages,
  }) => {
    await expect(animalsPages.transporterAdd.journeyStrip).toHaveCount(0);

    const referenceNumber = await choosePrivateTransporterAndGetReference(animalsPages);
    await expect(animalsPages.privateTransporter.journeyStrip).toHaveCount(0);

    await animalsPages.transporter.open(referenceNumber);
    await expect(animalsPages.transporter.journeyStrip).toBeVisible();
    await expect(animalsPages.transporter.statusTag).toHaveText('Draft');
    await expect(animalsPages.transporter.notificationReference).toContainText(referenceNumber);

    await animalsPages.transporter.addTransporter.click();
    await animalsPages.transporterAdd.heading.waitFor();
    await animalsPages.transporterAdd.transporterType('Commercial').check();
    await animalsPages.transporterAdd.continueButton.click();
    await animalsPages.commercialTransporter.heading.waitFor();
    await expect(animalsPages.commercialTransporter.journeyStrip).toBeVisible();
    await expect(animalsPages.commercialTransporter.statusTag).toHaveText('Draft');
  });
});
