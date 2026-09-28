import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { PlantsPages } from '@page-objects';
import type { PlantsJourney } from '@flows/plants/journey';

const PLANTS = 'Plants for planting';
const POTATOES = 'Potatoes (seed or ware)';
const WOOD = 'Wood and cut trees';
const CONSIGNOR = 'Consignor or exporter';
const NUMBERS = 'Identification numbers';

const addressNamed = (name: string) => ({
  name,
  addressLine1: '4 Nursery Lane',
  townOrCity: 'Perth',
  postcode: 'PH1 5EX',
  countryCode: 'GB',
  phone: '01738 555 0143',
  email: 'parties@example.co.uk',
});

/** Walk the opening run so the next-page assertions exercise its scope rules. */
async function toParties(plantsPages: PlantsPages, journey: PlantsJourney, type: string, destination: string): Promise<string> {
  const reference = await journey.startNotification();
  await journey.chooseCommodityType(type);
  if (type === POTATOES) {
    await journey.addCommodityLine('Seed potatoes', { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' });
  } else if (type === PLANTS) {
    await journey.addCommodityLine(PLANTS, {
      Genus: 'Quercus (oak)',
      Species: 'Quercus robur',
      'Commodity code': '0602 20 20',
      Quantity: '120',
      'EPPO code': 'QUERO',
    });
  } else {
    await journey.addCommodityLine('Cut coniferous trees more than 3 metres high', {
      'Commodity code': '4403 25 10',
      Quantity: '40',
      'Size of the trees': '4.5',
      'Phytosanitary treatments applied': 'Kiln dried (KD)',
    });
  }
  await journey.toOrigin();
  if (type === POTATOES) {
    await journey.toArrivalDetails('France');
    await plantsPages.arrivalDetails.arrivalTime.fill('14:30');
    await plantsPages.arrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
  } else {
    await journey.toArrivalStatus('Germany');
    await journey.answerArrivalStatus('No, it has not arrived yet');
  }
  await plantsPages.arrivalDetails.arrivalDate.fill('27/3/2027');
  await plantsPages.arrivalDetails.btnSaveAndContinue.click();
  await plantsPages.placeOfDestination.searchFor(destination);
  await plantsPages.placeOfDestination.address(destination).check();
  await plantsPages.placeOfDestination.btnSaveAndContinue.click();
  return reference;
}

test.describe('High-risk plants consignment parties section', { tag: '@integration' }, () => {
  for (const type of [PLANTS, WOOD]) {
    test(`${type}: consignor is required, saves, and continues to scoped identification numbers`, async ({
      pages,
      plantsPages,
      plantsJourney,
      addressBookApi,
    }) => {
      const name = `Parties Nursery ${randomUUID()}`;
      await addressBookApi.createAddress(addressNamed(name));
      const reference = await toParties(plantsPages, plantsJourney, type, name);
      const consignor = plantsPages.consignorSelect;
      const numbers = plantsPages.identificationNumbers;

      await expect(pages.page).toHaveURL(consignor.expectedUrl(reference));
      await expect(consignor.heading).toBeVisible();
      await consignor.btnSaveAndContinue.click();
      await expect(consignor.errorSummary).toContainText('Select a consignor from the list');
      await consignor.searchFor(name);
      await consignor.address(name).check();
      await consignor.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(numbers.expectedUrl(reference));
      await expect(numbers.heading).toBeVisible();
      await expect(numbers.producer).toHaveCount(0);
      await expect(numbers.crop).toHaveCount(0);
      await expect(numbers.consignment).toBeVisible();
      if (type === PLANTS) {
        await expect(numbers.supplier).toBeVisible();
        await numbers.supplier.fill('GB-12345');
      } else {
        await expect(numbers.supplier).toHaveCount(0);
      }
      // The optional reference can be left blank, including on wood's only field.
      await numbers.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
      await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
      await expect(plantsPages.overview.taskRow(CONSIGNOR)).toContainText('Completed');
      await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText(type === WOOD ? 'Optional' : 'Completed');
      await consignor.open(reference);
      await expect(consignor.selectedAddress(name)).toBeVisible();
      await numbers.open(reference);
      if (type === PLANTS) await expect(numbers.supplier).toHaveValue('GB-12345');
      await numbers.consignment.fill('SHIP_2027_001');
      await numbers.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
      await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText('Completed');
      await numbers.open(reference);
      await expect(numbers.consignment).toHaveValue('SHIP_2027_001');
      if (type === WOOD) {
        await numbers.consignment.clear();
        await numbers.btnSaveAndContinue.click();
        await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
        await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText('Optional');
        await numbers.open(reference);
        await expect(numbers.consignment).toHaveValue('');
      }
    });
  }

  test('potatoes skip consignor and require producer and crop numbers', async ({ pages, plantsPages, plantsJourney, addressBookApi }) => {
    const name = `Potato Destination ${randomUUID()}`;
    await addressBookApi.createAddress(addressNamed(name));
    const reference = await toParties(plantsPages, plantsJourney, POTATOES, name);
    const numbers = plantsPages.identificationNumbers;
    await expect(pages.page).toHaveURL(numbers.expectedUrl(reference));
    await expect(numbers.heading).toBeVisible();
    await expect(numbers.supplier).toHaveCount(0);
    await expect(numbers.producer).toBeVisible();
    await expect(numbers.crop).toBeVisible();
    await expect(numbers.consignment).toBeVisible();
    await numbers.btnSaveAndContinue.click();
    await expect(numbers.errorSummary).toContainText('Enter the identification number of the producer');
    await expect(numbers.errorSummary).toContainText('Enter the crop identification number');
    await numbers.producer.fill('P'.repeat(59));
    await numbers.crop.fill('C'.repeat(59));
    await numbers.btnSaveAndContinue.click();
    await expect(numbers.errorSummary).toContainText('Producer identification number must be 58 characters or less');
    await expect(numbers.errorSummary).toContainText('Crop identification number must be 58 characters or less');
    await numbers.producer.fill('P'.repeat(58));
    await numbers.crop.fill('C'.repeat(58));
    await numbers.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
    await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.taskRowByTitle(CONSIGNOR)).toHaveCount(0);
    await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText('Completed');
    await numbers.open(reference);
    await expect(numbers.producer).toHaveValue('P'.repeat(58));
    await expect(numbers.crop).toHaveValue('C'.repeat(58));
  });

  test('supplier and consignment numbers enforce length and consignment syntax', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const name = `Numbers Nursery ${randomUUID()}`;
    await addressBookApi.createAddress(addressNamed(name));
    const reference = await toParties(plantsPages, plantsJourney, PLANTS, name);
    const consignor = plantsPages.consignorSelect;
    const numbers = plantsPages.identificationNumbers;
    await consignor.searchFor(name);
    await consignor.address(name).check();
    await consignor.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(numbers.expectedUrl(reference));
    await numbers.btnSaveAndContinue.click();
    await expect(numbers.errorSummary).toContainText('Enter the identification number of the supplier');
    await numbers.supplier.fill('S'.repeat(59));
    await numbers.consignment.fill('N'.repeat(59));
    await numbers.btnSaveAndContinue.click();
    await expect(numbers.errorSummary).toContainText('Supplier identification number must be 58 characters or less');
    await expect(numbers.errorSummary).toContainText('Consignment number must be 58 characters or less');
    await numbers.supplier.fill('S'.repeat(58));
    await numbers.consignment.fill('SHIP-2027!');
    await numbers.btnSaveAndContinue.click();
    await expect(numbers.errorSummary).toContainText('Consignment number must only contain letters, numbers and underscores');
    await numbers.consignment.fill('N'.repeat(58));
    await numbers.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
    await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText('Completed');
    await numbers.open(reference);
    await expect(numbers.supplier).toHaveValue('S'.repeat(58));
    await expect(numbers.consignment).toHaveValue('N'.repeat(58));
  });

  test('changing type clears parties answers that leave scope and retains the consignment reference', async ({
    pages,
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const name = `Scope Nursery ${randomUUID()}`;
    await addressBookApi.createAddress(addressNamed(name));
    const reference = await toParties(plantsPages, plantsJourney, PLANTS, name);
    const consignor = plantsPages.consignorSelect;
    const numbers = plantsPages.identificationNumbers;
    await consignor.searchFor(name);
    await consignor.address(name).check();
    await consignor.btnSaveAndContinue.click();
    await numbers.supplier.fill('GB-12345');
    await numbers.consignment.fill('SHIP_2027');
    await numbers.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.consignmentContactSelect.expectedUrl(reference));
    await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));

    await plantsJourney.changeCommodityType(reference, POTATOES);
    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRowByTitle(CONSIGNOR)).toHaveCount(0);
    await numbers.open(reference);
    await expect(numbers.supplier).toHaveCount(0);
    await numbers.producer.fill('PRODUCER_123');
    await numbers.crop.fill('CROP_456');
    await numbers.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
    await expect(plantsPages.overview.taskRow(NUMBERS)).toContainText('Completed');

    await plantsJourney.changeCommodityType(reference, PLANTS);
    await numbers.open(reference);
    await expect(numbers.supplier).toHaveValue('');
    await expect(numbers.producer).toHaveCount(0);
    await expect(numbers.crop).toHaveCount(0);
    await expect(numbers.consignment).toHaveValue('SHIP_2027');
    await plantsPages.overview.open(reference);
    await expect(plantsPages.overview.taskRow(CONSIGNOR)).toContainText('Not yet started');
    await consignor.open(reference);
    await expect(consignor.selectedAddress(name)).toHaveCount(0);
    await consignor.searchFor(name);
    await expect(consignor.address(name)).not.toBeChecked();

    await plantsJourney.changeCommodityType(reference, POTATOES);
    await numbers.open(reference);
    await expect(numbers.producer).toHaveValue('');
    await expect(numbers.crop).toHaveValue('');
    await expect(numbers.consignment).toHaveValue('SHIP_2027');
  });
});
