import { CONSIGNMENT_ADDRESSES } from '@domain/animals/constants/consignment-addresses-page';
import { test, expect } from '@fixtures/visual';

test.use({ headless: true });

test.describe('Consignor picker (visual regression)', { tag: '@visual' }, () => {
  test('shows the address search box with its label, hint and joined search button', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    await animalsPages.overview.task(CONSIGNMENT_ADDRESSES).click();
    await animalsPages.addresses.addParty('Consignor').click();
    await animalsPages.consignorSelection.heading.waitFor();

    await expect(animalsPages.consignorSelection.searchRow).toHaveScreenshot('consignor-picker-search-row.png');
  });
});
