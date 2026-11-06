import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { transporters } from '@domain/animals/constants/transporters';
import { SET_BASES } from '@page-objects/shared/sets';
import { OPENING_RUN_TASKS_OVERLAND_WITHOUT_IDENTIFICATION, certificateDocument } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Poultry by rail in transit', () => {
  test('walks a poultry-by-rail notification in transit from create to the review, with no identification task and every overview task complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkOpeningRunPoultryByRail(certificateDocument('RAILDOC'));
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));

    await animalsPages.overview.open(referenceNumber);
    await expect(animalsPages.overview.taskNames).toHaveText(OPENING_RUN_TASKS_OVERLAND_WITHOUT_IDENTIFICATION);
    await expect(animalsPages.overview.taskStatuses).toHaveText(OPENING_RUN_TASKS_OVERLAND_WITHOUT_IDENTIFICATION.map(() => 'Complete'));
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Country of origin')).toHaveText('Germany');

    const speciesCard = animalsPages.notificationView.speciesCard(commodityLines.chicken);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.chicken.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('400');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText('Transit');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Destination country')).toHaveText('Ireland');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Port of exit')).toContainText('Holyhead Port');

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
