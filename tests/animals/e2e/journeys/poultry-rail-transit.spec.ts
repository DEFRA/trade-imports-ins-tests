import { commodityLines } from '@domain/animals/constants/commodity-lines';
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

    const speciesCard = animalsPages.notificationView.speciesCard(commodityLines.chicken);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.chicken.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('400');

    const mainImportReason = animalsPages.notificationView.summaryCard('Main import reason');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Main import reason')).toHaveText('Transit');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Destination country')).toHaveText('Ireland');
    await expect(animalsPages.notificationView.summaryValue(mainImportReason, 'Port of exit')).toContainText('Holyhead Port');

    const transitCountries = animalsPages.notificationView.summaryCard('Transit countries');
    await expect(
      animalsPages.notificationView.summaryValue(transitCountries, 'Countries that the consignment will travel through'),
    ).toHaveText('Belgium, France');

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
      meansOfTransport.railway.display,
    );

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(
      transporters.garciaLivestockTransport.display,
    );
  });
});
