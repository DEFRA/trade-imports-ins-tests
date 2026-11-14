import { commodityLines, speciesBlockHeading } from '@domain/animals/constants/commodity-lines';
import { openReviewFromCompleteOverview } from '@page-objects/shared/journey-checks';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { transporters } from '@domain/animals/constants/transporters';
import { OVERLAND_OVERVIEW_TASKS, certificateDocument } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Poultry by rail in transit', () => {
  test('walks a poultry-by-rail notification in transit from create to the review, passing through Identification details with every overview task complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkPoultryByRail(certificateDocument('RAILDOC'));
    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));

    await openReviewFromCompleteOverview(animalsPages.overview, animalsJourney, referenceNumber, OVERLAND_OVERVIEW_TASKS);

    const originOfImport = animalsPages.notificationView.summaryCard('Origin of import');
    await expect(animalsPages.notificationView.summaryValue(originOfImport, 'Country of origin')).toHaveText('Germany');

    const speciesBlock = animalsPages.notificationView.speciesBlock(commodityLines.chicken);
    await expect(animalsPages.notificationView.whatAreYouImportingSpecies).toHaveText(speciesBlockHeading(commodityLines.chicken));
    await expect(animalsPages.notificationView.summaryValue(speciesBlock, 'Number of animals')).toHaveText('400');

    const mainImportReason = animalsPages.notificationView.summaryCard('Main import reason');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Main import reason')).toHaveText('Transit');
    await expect(animalsPages.notificationView.summaryKeys(mainImportReason)).toHaveText([
      'Main import reason',
      'Exit border control post',
      'Destination country',
    ]);
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Exit border control post')).toContainText('Holyhead Port');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Destination country')).toHaveText('Ireland');

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(
      animalsPages.notificationView.summaryValue(arrivalDetails, 'Countries that the consignment will travel through'),
    ).toHaveText('Belgium, France');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
      meansOfTransport.railway.display,
    );

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(
      transporters.garciaLivestockTransport.display,
    );
  });
});
