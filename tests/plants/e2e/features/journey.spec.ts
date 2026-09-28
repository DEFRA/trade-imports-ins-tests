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
    test(`${scenario.name}: sign in, submit and view the saved notification`, async ({
      pages,
      plantsPages,
      plantsJourney,
      addressBookApi,
    }) => {
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
        await plantsPages.arrivalDetails.arrivalTime.fill('14:30');
        await plantsPages.arrivalDetails.selectPlaceOfLanding('Aberdeen Harbour (GB ABD)');
      } else {
        await plantsJourney.toArrivalStatus(scenario.country);
        await plantsJourney.answerArrivalStatus('No, it has not arrived yet');
      }
      await plantsPages.arrivalDetails.arrivalDate.fill(arrivalDate);
      await plantsPages.arrivalDetails.btnSaveAndContinue.click();
      await plantsPages.placeOfDestination.searchFor(address.name);
      await plantsPages.placeOfDestination.address(address.name).check();
      await plantsPages.placeOfDestination.btnSaveAndContinue.click();
      if (scenario.type !== POTATOES) {
        await plantsPages.consignorSelect.searchFor(address.name);
        await plantsPages.consignorSelect.address(address.name).check();
        await plantsPages.consignorSelect.btnSaveAndContinue.click();
      }
      if (scenario.type === POTATOES) {
        await plantsPages.identificationNumbers.producer.fill('P123');
        await plantsPages.identificationNumbers.crop.fill('C123');
      } else if (scenario.type === PLANTS) {
        await plantsPages.identificationNumbers.supplier.fill('DE-12345');
      }
      await plantsPages.identificationNumbers.consignment.fill('JOURNEY_123');
      await plantsPages.identificationNumbers.btnSaveAndContinue.click();
      await plantsPages.consignmentContactSelect.searchFor(address.name);
      await plantsPages.consignmentContactSelect.address(address.name).check();
      await plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.overview.expectedUrl(reference));
      await plantsPages.overview.taskRowLink('Check and submit').click();
      await expect(plantsPages.notificationView.heading).toBeVisible();
      await plantsPages.notificationView.btnContinue.click();
      await expect(pages.page).toHaveURL(plantsPages.declaration.expectedUrl(reference));
      await plantsPages.declaration.checkbox.check();
      await plantsPages.declaration.btnContinue.click();

      await expect(pages.page).toHaveURL(plantsPages.confirmation.expectedUrl(reference));
      await expect(plantsPages.confirmation.heading).toBeVisible();
      await expect(plantsPages.confirmation.panel).toContainText(reference);
      await expect(plantsPages.confirmation.lateBanner).toHaveCount(scenario.late ? 1 : 0);
      await plantsPages.confirmation.viewNotification.click();
      // Reload proves the submitted answers survive a fresh read.
      await pages.page.reload();
      await expect(pages.page).toHaveURL(plantsPages.notificationView.expectedUrl(reference));
      await expect(plantsPages.notificationView.heading).toBeVisible();
      await expect(plantsPages.overview.reference).toHaveText(reference);
      await expect(plantsPages.overview.statusTag).toHaveText('Submitted');
      await expect(plantsPages.notificationView.changeLinks).toHaveCount(0);
      await expect(plantsPages.notificationView.btnContinue).toHaveCount(0);
      await expect(plantsPages.notificationView.lateBanner).toHaveCount(scenario.late ? 1 : 0);
      await expect(plantsPages.notificationView.card('Import details')).toContainText(scenario.country);
      const commodity = plantsPages.notificationView.card('Commodity 1');
      await expect(commodity).toContainText(scenario.category);
      for (const value of Object.values(scenario.line)) {
        await expect(commodity).toContainText(value);
      }
      await expect(plantsPages.notificationView.card('Arrival details')).toContainText(arrivalDate);
      await expect(plantsPages.notificationView.card('Place of destination')).toContainText(address.name);
      await expect(plantsPages.notificationView.card('Identification numbers')).toContainText('JOURNEY_123');
      await expect(plantsPages.notificationView.card('Contact')).toContainText(address.name);
      await expect(plantsPages.notificationView.card('Contact')).toContainText(address.email);
      if (scenario.type !== POTATOES) {
        await expect(plantsPages.notificationView.card('Consignor or exporter')).toContainText(address.name);
      }
      await plantsPages.dashboard.open();
      await plantsPages.dashboard.searchForReference(reference);
      await expect(plantsPages.dashboard.notificationCard(reference)).toBeVisible();
      await expect(plantsPages.dashboard.statusTag(reference)).toHaveText('Submitted');
    });
  }
});
