import { test, expect } from '@fixtures';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS_FOR_PLANTING = 'Plants for planting';
const WOOD_AND_CUT_TREES = 'Wood and cut trees';

const SEED_POTATOES = 'Seed potatoes';
const WARE_POTATOES = 'Ware potatoes';
const TREES_FOR_PLANTING = 'Trees for planting';
const CUT_CONIFEROUS_TREES = 'Cut coniferous trees more than 3 metres high';

const MARIS_PIPER = 'Maris Piper';
const KING_EDWARD = 'King Edward';
const OAK = 'Quercus (oak)';

const potatoLine = (variety: string, quantity: string) => ({
  Variety: variety,
  Quantity: quantity,
  'Intended use': 'Planting',
});

test.describe('High-risk plants commodity section', { tag: '@integration' }, () => {
  test('each commodity type offers only the categories that belong to it', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    const details = pages.plantsCommodityDetails;

    await plantsJourney.chooseCommodityType(POTATOES);
    await expect(pages.page).toHaveURL(details.expectedUrl(reference));
    await expect(details.category(SEED_POTATOES)).toBeVisible();
    await expect(details.category(WARE_POTATOES)).toBeVisible();
    await expect(details.categoryRadios).toHaveCount(2);

    await plantsJourney.changeCommodityType(reference, PLANTS_FOR_PLANTING);
    await expect(pages.page).toHaveURL(details.expectedUrl(reference));
    await expect(details.category(PLANTS_FOR_PLANTING)).toBeVisible();
    await expect(details.category(TREES_FOR_PLANTING)).toBeVisible();
    await expect(details.categoryRadios).toHaveCount(2);

    // The five wood categories are the only set the journey offers that is not
    // a pair, so the count is worth stating as well as the one named category.
    await plantsJourney.changeCommodityType(reference, WOOD_AND_CUT_TREES);
    await expect(pages.page).toHaveURL(details.expectedUrl(reference));
    await expect(details.category(CUT_CONIFEROUS_TREES)).toBeVisible();
    await expect(details.categoryRadios).toHaveCount(5);
  });

  test('a potato line is asked for its variety, quantity and intended use', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);

    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine(MARIS_PIPER, '250'));

    await expect(pages.page).toHaveURL(pages.plantsCommodities.expectedUrl(reference));
    await expect(pages.plantsCommodities.lineRows).toHaveCount(1);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText(SEED_POTATOES);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText(MARIS_PIPER);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText('250');
  });

  test('a plants-for-planting line names its genus, species and codes', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);

    await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, {
      Genus: OAK,
      Species: 'Quercus robur',
      'Commodity code': '0602 20 20',
      Quantity: '120',
      'EPPO code': 'QUERO',
    });

    await expect(pages.page).toHaveURL(pages.plantsCommodities.expectedUrl(reference));
    await expect(pages.plantsCommodities.lineRows.first()).toContainText(PLANTS_FOR_PLANTING);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText(OAK);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText('120');
  });

  test('a wood line is asked for its treatments, and a cut-tree line for their size', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(WOOD_AND_CUT_TREES);

    await pages.plantsCommodityDetails.category(CUT_CONIFEROUS_TREES).check();
    await pages.plantsCommodityDetails.btnContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsCommodityDetails.editUrl(reference, 0));

    // Wood is identified by its commodity code, not a genus, and only cut trees
    // are asked how tall they are.
    await expect(pages.plantsCommodityDetails.field('Phytosanitary treatments applied')).toBeVisible();
    await expect(pages.plantsCommodityDetails.field('Size of the trees')).toBeVisible();
    await expect(pages.plantsCommodityDetails.field('Genus')).toHaveCount(0);

    await pages.plantsCommodityDetails.field('Commodity code').fill('4403 25 10');
    await pages.plantsCommodityDetails.field('Quantity').fill('40');
    await pages.plantsCommodityDetails.field('Size of the trees').fill('4.5');
    await pages.plantsCommodityDetails.field('Phytosanitary treatments applied').fill('Kiln dried (KD)');
    await pages.plantsCommodityDetails.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsCommodities.expectedUrl(reference));
    await expect(pages.plantsCommodities.lineRows.first()).toContainText(CUT_CONIFEROUS_TREES);
    await expect(pages.plantsCommodities.lineRows.first()).toContainText('40');
  });

  test('Change reopens a saved line and Remove drops it', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine(MARIS_PIPER, '250'));
    await plantsJourney.addAnotherCommodityLine(WARE_POTATOES, potatoLine(KING_EDWARD, '80'));

    await expect(pages.plantsCommodities.lineRows).toHaveCount(2);

    await pages.plantsCommodities.linkChange(1).click();

    await expect(pages.page).toHaveURL(pages.plantsCommodityDetails.editUrl(reference, 0));
    await expect(pages.plantsCommodityDetails.field('Variety')).toHaveValue(MARIS_PIPER);

    await pages.plantsCommodityDetails.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.plantsCommodities.expectedUrl(reference));

    await pages.plantsCommodities.btnRemove(1).click();

    await expect(pages.plantsCommodities.lineRows).toHaveCount(1);
    await expect(pages.plantsCommodities.table).not.toContainText(MARIS_PIPER);
    await expect(pages.plantsCommodities.table).toContainText(KING_EDWARD);
  });

  test('changing the commodity type removes the lines the new type cannot hold', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine(MARIS_PIPER, '250'));

    await pages.plantsCommodityType.open(reference);
    await expect(pages.plantsCommodityType.linesWarning).toBeVisible();

    await pages.plantsCommodityType.commodityType(WOOD_AND_CUT_TREES).check();
    await pages.plantsCommodityType.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsCommodities.removedUrl(reference, 1));
    await expect(pages.plantsCommodities.removedBanner).toContainText(`We removed 1 commodity that is not ${WOOD_AND_CUT_TREES}`);
    await expect(pages.plantsCommodities.emptyState).toBeVisible();
    await expect(pages.plantsCommodities.table).toHaveCount(0);
  });

  test('an emptied consignment is held at the at-least-one error', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine(MARIS_PIPER, '250'));
    await plantsJourney.changeCommodityType(reference, WOOD_AND_CUT_TREES);

    await expect(pages.page).toHaveURL(pages.plantsCommodities.removedUrl(reference, 1));

    await pages.plantsCommodities.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsCommodities.removedUrl(reference, 1));
    await expect(pages.plantsCommodities.errorSummary).toContainText('Add at least one commodity');
  });

  test('the commodities task row reads Completed once the section is answered', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine(MARIS_PIPER, '250'));

    await pages.plantsCommodities.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsOrigin.expectedUrl(reference));

    await pages.plantsOverview.open(reference);
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.taskRow('What are you importing?')).toContainText('Completed');
  });
});
