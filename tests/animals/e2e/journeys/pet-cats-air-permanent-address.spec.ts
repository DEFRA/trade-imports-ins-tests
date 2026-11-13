import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { MANDATORY_COMMODITY_LINES } from '@domain/animals/constants/journey-commodity-line-answers';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { internalMarketPurposes } from '@domain/animals/constants/internal-market-purposes';
import { openReviewFromCompleteOverview } from '@page-objects/shared/journey-checks';
import { AIR_OR_SEA_OVERVIEW_TASKS, certificateDocument } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Pet cats by air with permanent addresses', () => {
  test('walks a pet-cats-by-air notification from create to submitted, with a mixed permanent-address choice and every task complete', async ({
    animalsJourney,
    animalsPages,
    pages,
    referenceDataApi,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkCatsByAir(certificateDocument('CATDOC'), async () => {
      await expect(animalsPages.addresses.permanentAddressText).toHaveText('Permanent addresses added for 2 animals');
    });
    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));

    await openReviewFromCompleteOverview(animalsPages.overview, animalsJourney, referenceNumber, AIR_OR_SEA_OVERVIEW_TASKS);

    const originOfImport = animalsPages.notificationView.summaryCard('Origin of import');
    await expect(animalsPages.notificationView.summaryValue(originOfImport, 'Country of origin')).toHaveText('Spain');

    const mainImportReason = animalsPages.notificationView.summaryCard('Main import reason');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Purpose in the market')).toHaveText(
      internalMarketPurposes.companionAnimalNotForResaleOrRehoming.display,
    );

    const speciesCard = animalsPages.notificationView.speciesCard(commodityLines.domesticCat);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.domesticCat.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('2');

    const commonName = await referenceDataApi.findCommonName(commodityLines.domesticCat);
    const addresses = animalsPages.notificationView.summaryCard('Addresses');
    await expect(animalsPages.notificationView.summaryValue(addresses, `${commonName} 1`)).toContainText(
      MANDATORY_ANSWERS.parties.placeOfDestination,
    );
    await expect(animalsPages.notificationView.summaryValue(addresses, `${commonName} 2`)).toContainText(
      MANDATORY_COMMODITY_LINES.domesticCat.permanentAddress.addressLine1,
    );

    await animalsJourney.submitFromReview();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});
