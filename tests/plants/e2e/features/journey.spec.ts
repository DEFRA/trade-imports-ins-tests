import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import type { CommodityLine } from '@flows/plants-journey';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS = 'Plants for planting';

// Mirror the five mural use cases in the plants set's flow/fixtures/happy-path.json.
const scenarios: { name: string; type: string; category: string; country: string; late: boolean; line: CommodityLine }[] = [
  {
    name: 'ware potatoes from Spain before arrival',
    type: POTATOES,
    category: 'Ware potatoes',
    country: 'Spain',
    late: false,
    line: { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Eating' },
  },
  {
    name: 'ware potatoes from Portugal notified late',
    type: POTATOES,
    category: 'Ware potatoes',
    country: 'Portugal',
    late: true,
    line: { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Eating' },
  },
  {
    name: 'seed potatoes from the Netherlands',
    type: POTATOES,
    category: 'Seed potatoes',
    country: 'Netherlands (the)',
    late: false,
    line: { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' },
  },
  {
    name: 'spruce from Germany with species and EPPO code',
    type: PLANTS,
    category: PLANTS,
    country: 'Germany',
    late: false,
    line: { Genus: 'Picea (spruce)', Species: 'Picea abies', 'Commodity code': '0602 20 20', Quantity: '40', 'EPPO code': 'PIEAB' },
  },
  {
    name: 'conifer wood without bark from Italy with treatments',
    type: 'Wood and cut trees',
    category: 'Conifer wood without bark (from Italy, France, Portugal or Spain)',
    country: 'Italy',
    late: false,
    line: { 'Commodity code': '4403 21 10', Quantity: '12', 'Phytosanitary treatments applied': 'Kiln dried (KD)' },
  },
];

// These full walks include sign-in even when worker session reuse is enabled.
test.use({ storageState: COLD_START });

test.describe('High-risk plants full happy-path journeys', { tag: '@integration' }, () => {
  for (const scenario of scenarios) {
    test(`${scenario.name}: sign in, submit and view the saved notification`, async ({ pages, plantsJourney, addressBookApi }) => {
      const address = await addressBookApi.createAddress({
        name: `Journey Nursery ${randomUUID()}`,
        addressLine1: '4 Nursery Lane',
        townOrCity: 'Perth',
        postcode: 'PH1 5EX',
        countryCode: 'GB',
        phone: '01738 555 0143',
        email: 'journey@example.co.uk',
      });
      // Relative London dates avoid fixed fixtures expiring and timing boundaries.
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + (scenario.late ? -1 : 7));
      const arrivalDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' }).format(date);
      const reference = await plantsJourney.startNotification();
      expect(reference).toMatch(/^GBN-HRP-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/);
      await plantsJourney.chooseCommodityType(scenario.type);
      await plantsJourney.addCommodityLine(scenario.category, scenario.line);
      await plantsJourney.toOrigin();
      if (scenario.type === POTATOES) {
        await plantsJourney.toArrivalDetails(scenario.country);
        await pages.plantsArrivalDetails.arrivalTime.fill('14:30');
        await pages.plantsArrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
      } else {
        await plantsJourney.toArrivalStatus(scenario.country);
        await plantsJourney.answerArrivalStatus('No, it has not arrived yet');
      }
      await pages.plantsArrivalDetails.arrivalDate.fill(arrivalDate);
      await pages.plantsArrivalDetails.btnSaveAndContinue.click();
      await pages.plantsPlaceOfDestination.searchFor(address.name);
      await pages.plantsPlaceOfDestination.address(address.name).check();
      await pages.plantsPlaceOfDestination.btnSaveAndContinue.click();
      if (scenario.type !== POTATOES) {
        await pages.plantsConsignorSelect.searchFor(address.name);
        await pages.plantsConsignorSelect.address(address.name).check();
        await pages.plantsConsignorSelect.btnSaveAndContinue.click();
      }
      if (scenario.type === POTATOES) {
        await pages.plantsIdentificationNumbers.producer.fill('P123');
        await pages.plantsIdentificationNumbers.crop.fill('C123');
      } else if (scenario.type === PLANTS) {
        await pages.plantsIdentificationNumbers.supplier.fill('DE-12345');
      }
      await pages.plantsIdentificationNumbers.consignment.fill('JOURNEY_123');
      await pages.plantsIdentificationNumbers.btnSaveAndContinue.click();
      await pages.plantsConsignmentContactSelect.searchFor(address.name);
      await pages.plantsConsignmentContactSelect.address(address.name).check();
      await pages.plantsConsignmentContactSelect.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
      await pages.plantsOverview.taskRowLink('Check and submit').click();
      await expect(pages.plantsNotificationView.heading).toBeVisible();
      await pages.plantsNotificationView.btnContinue.click();
      await expect(pages.page).toHaveURL(pages.plantsDeclaration.expectedUrl(reference));
      await pages.plantsDeclaration.checkbox.check();
      await pages.plantsDeclaration.btnContinue.click();

      await expect(pages.page).toHaveURL(pages.plantsConfirmation.expectedUrl(reference));
      await expect(pages.plantsConfirmation.heading).toBeVisible();
      await expect(pages.plantsConfirmation.panel).toContainText(reference);
      await expect(pages.plantsConfirmation.lateBanner).toHaveCount(scenario.late ? 1 : 0);
      await pages.plantsConfirmation.viewNotification.click();
      // Reload proves the submitted answers survive a fresh read.
      await pages.page.reload();
      await expect(pages.page).toHaveURL(pages.plantsNotificationView.expectedUrl(reference));
      await expect(pages.plantsNotificationView.heading).toBeVisible();
      await expect(pages.plantsOverview.reference).toHaveText(reference);
      await expect(pages.plantsOverview.statusTag).toHaveText('Submitted');
      await expect(pages.plantsNotificationView.changeLinks).toHaveCount(0);
      await expect(pages.plantsNotificationView.btnContinue).toHaveCount(0);
      await expect(pages.plantsNotificationView.lateBanner).toHaveCount(scenario.late ? 1 : 0);
      await expect(pages.plantsNotificationView.card('Import details')).toContainText(scenario.country);
      const commodity = pages.plantsNotificationView.card('Commodity 1');
      await expect(commodity).toContainText(scenario.category);
      for (const value of Object.values(scenario.line)) {
        await expect(commodity).toContainText(value);
      }
      await expect(pages.plantsNotificationView.card('Arrival details')).toContainText(arrivalDate);
      await expect(pages.plantsNotificationView.card('Place of destination')).toContainText(address.name);
      await expect(pages.plantsNotificationView.card('Identification numbers')).toContainText('JOURNEY_123');
      await expect(pages.plantsNotificationView.card('Contact')).toContainText(address.name);
      await expect(pages.plantsNotificationView.card('Contact')).toContainText(address.email);
      if (scenario.type !== POTATOES) {
        await expect(pages.plantsNotificationView.card('Consignor or exporter')).toContainText(address.name);
      }
      await pages.plantsDashboard.open();
      await pages.plantsDashboard.searchForReference(reference);
      await expect(pages.plantsDashboard.notificationCard(reference)).toBeVisible();
      await expect(pages.plantsDashboard.statusTag(reference)).toHaveText('Submitted');
    });
  }
});
