import { test, expect } from '@fixtures';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS_FOR_PLANTING = 'Plants for planting';
const WOOD_AND_CUT_TREES = 'Wood and cut trees';

const SEED_POTATOES = 'Seed potatoes';
const WARE_POTATOES = 'Ware potatoes';
const CONIFER_WOOD_WITHOUT_BARK = 'Conifer wood without bark (from Italy, France, Portugal or Spain)';

const ORIGIN_TASK_ROW = 'Where is this consignment coming from?';

// The origin block is the whole Common SPS Area, so Norway is on offer even
// though it is not an EU member State — which is what makes it the country that
// tells the seed-potato scope apart from the plants-and-wood one.
const FRANCE = 'France';
const GERMANY = 'Germany';
const ITALY = 'Italy';
const NORWAY = 'Norway';
const SPAIN = 'Spain';

const WARE_POTATO_GUIDANCE =
  'Notify ware potatoes grown, or suspected to have been grown, in Poland, Portugal, Romania or Spain. Spain does not include the Balearic Islands.';

// The en dashes are the copy's own — matched literally so a change of
// punctuation is caught here rather than passing on a loose substring.
const WARE_POTATO_ERROR = 'Select Poland, Portugal, Romania or Spain – ware potatoes from other countries do not need to be notified';
const CONIFER_WOOD_ERROR =
  'Select Italy, France, Portugal or Spain – conifer wood without bark from other countries does not need to be notified';
const EU_MEMBER_STATE_ERROR = 'Select an EU member state – plants and wood from other countries do not need to be notified';

const COUNTRY_REQUIRED_ERROR = 'Select the country where the consignment originates from';

const potatoLine = (variety: string, intendedUse: string) => ({
  Variety: variety,
  Quantity: '250',
  'Intended use': intendedUse,
});

const woodLine = {
  'Commodity code': '4403 25 10',
  Quantity: '40',
  'Phytosanitary treatments applied': 'Kiln dried (KD)',
};

const plantsLine = {
  Genus: 'Quercus (oak)',
  Species: 'Quercus robur',
  'Commodity code': '0602 20 20',
  Quantity: '120',
  'EPPO code': 'QUERO',
};

test.describe('High-risk plants origin section', { tag: '@integration' }, () => {
  test('a country picked from the type-ahead is saved and shown again on return', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine('Maris Piper', 'Planting'));
    await plantsJourney.toOrigin();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));

    await pages.plantsOrigin.selectCountry(FRANCE);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    // The arrival-status question that follows origin is out of scope for
    // potatoes, so Continue passes it over and lands on the arrival details —
    // the page every commodity type is asked.
    await expect(pages.page).toHaveURL(pages.plantsArrivalDetails.expectedUrl(reference));

    await pages.plantsOrigin.open(reference);
    await expect(pages.plantsOrigin.countryOfOrigin).toHaveValue(FRANCE);
  });

  test('a seed-potato consignment may name any country in the origin block', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine('Maris Piper', 'Planting'));
    await plantsJourney.toOrigin();

    // Seed potatoes are scoped to the whole Common SPS Area, so nothing is
    // narrowed and no scope guidance is shown.
    await expect(pages.plantsOrigin.guidance).toHaveCount(0);

    await pages.plantsOrigin.selectCountry(NORWAY);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsArrivalDetails.expectedUrl(reference));
  });

  test('a ware-potato consignment is narrowed to Poland, Portugal, Romania or Spain', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(WARE_POTATOES, potatoLine('King Edward', 'Eating'));
    await plantsJourney.toOrigin();

    await expect(pages.plantsOrigin.guidance).toHaveText(WARE_POTATO_GUIDANCE);

    await pages.plantsOrigin.selectCountry(FRANCE);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));
    await expect(pages.plantsOrigin.errorSummary).toContainText(WARE_POTATO_ERROR);

    await pages.plantsOrigin.selectCountry(SPAIN);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsArrivalDetails.expectedUrl(reference));
  });

  test('a conifer-wood-without-bark line is narrowed to Italy, France, Portugal or Spain', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(WOOD_AND_CUT_TREES);
    await plantsJourney.addCommodityLine(CONIFER_WOOD_WITHOUT_BARK, woodLine);
    await plantsJourney.toOrigin();

    // Germany rather than a non-EU country: this scope is narrower than EU
    // membership, and only a member State outside the four proves that.
    await pages.plantsOrigin.selectCountry(GERMANY);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));
    await expect(pages.plantsOrigin.errorSummary).toContainText(CONIFER_WOOD_ERROR);

    await pages.plantsOrigin.selectCountry(ITALY);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    // Wood is asked whether the consignment has arrived, so Continue carries on
    // into the arrival section rather than returning to the Overview.
    await expect(pages.page).toHaveURL(pages.plantsArrivalStatus.expectedUrl(reference));
    await expect(pages.plantsArrivalStatus.heading).toBeVisible();
  });

  test('a plants-for-planting line is narrowed to the EU member States', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);
    await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, plantsLine);
    await plantsJourney.toOrigin();

    await pages.plantsOrigin.selectCountry(NORWAY);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));
    await expect(pages.plantsOrigin.errorSummary).toContainText(EU_MEMBER_STATE_ERROR);

    await pages.plantsOrigin.selectCountry(GERMANY);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    // Plants for planting are asked whether the consignment has arrived, so
    // Continue carries on into the arrival section.
    await expect(pages.page).toHaveURL(pages.plantsArrivalStatus.expectedUrl(reference));
    await expect(pages.plantsArrivalStatus.heading).toBeVisible();
  });

  test('the narrowing is enforced at Continue, so a saved country is refused once a ware-potato line joins it', async ({
    pages,
    plantsJourney,
  }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine('Maris Piper', 'Planting'));
    await plantsJourney.toOrigin();
    await pages.plantsOrigin.selectCountry(FRANCE);
    await pages.plantsOrigin.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsArrivalDetails.expectedUrl(reference));

    await pages.plantsCommodities.open(reference);
    await plantsJourney.addAnotherCommodityLine(WARE_POTATOES, potatoLine('King Edward', 'Eating'));

    await pages.plantsOrigin.open(reference);
    await expect(pages.plantsOrigin.guidance).toHaveText(WARE_POTATO_GUIDANCE);
    await expect(pages.plantsOrigin.countryOfOrigin).toHaveValue(FRANCE);

    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));
    await expect(pages.plantsOrigin.errorSummary).toContainText(WARE_POTATO_ERROR);
  });

  test('the required error names the consignment, not the animal', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine('Maris Piper', 'Planting'));
    await plantsJourney.toOrigin();

    await pages.plantsOrigin.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));
    await expect(pages.plantsOrigin.errorSummary).toContainText(COUNTRY_REQUIRED_ERROR);
    // The page is a port of the live-animals origin page, so the subject of the
    // error is the one string the port had to change (c-027).
    await expect(pages.plantsOrigin.errorSummary).not.toContainText('animal');
  });

  test('the origin task row reads Completed once a country is saved', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine('Maris Piper', 'Planting'));
    await plantsJourney.toOrigin();

    await pages.plantsOrigin.selectCountry(FRANCE);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    // Continue carries a potato notification on to the arrival details, so the
    // hub is reached by opening it rather than by being returned to it.
    await expect(pages.page).toHaveURL(pages.plantsArrivalDetails.expectedUrl(reference));

    await pages.plantsOverview.open(reference);
    await expect(pages.plantsOverview.taskRow(ORIGIN_TASK_ROW)).toContainText('Completed');
  });
});
