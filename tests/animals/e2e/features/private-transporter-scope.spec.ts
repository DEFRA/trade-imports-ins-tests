import { test, expect } from '@fixtures';
import { handTypedPrivateTransporter } from '@domain/animals/constants/transporters';

const { name, ...address } = handTypedPrivateTransporter('Jean Dupont');
const transporter = { name, address };

test.describe('Private transporter scope', { tag: '@duplicated-in-frontend' }, () => {
  test(
    "the saved country shows on the review's Transport details card, and a saved private transporter survives an add of the other type that the trader cancels",
    { tag: '@cross-browser' },
    async ({ animalsJourney, pages, animalsPages }) => {
      await animalsJourney.startNotification();
      await animalsJourney.answerCommodity();

      await animalsJourney.reachTransporterFromHub();
      await animalsJourney.chooseTransporterType('Private');
      await expect(animalsPages.privateTransporter.heading).toBeVisible();
      await expect(animalsPages.privateTransporter.country).toHaveValue('United Kingdom');

      await animalsPages.privateTransporter.name.fill(transporter.name);
      await animalsPages.privateTransporter.saveAndContinue.click();
      await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
      await expect(pages.page.getByRole('link', { name: 'Enter address line 1' })).toBeVisible();

      await animalsPages.privateTransporter.addressLine1.fill(transporter.address.addressLine1);
      await animalsPages.privateTransporter.townOrCity.fill(transporter.address.townOrCity);
      await animalsPages.privateTransporter.postcode.fill(transporter.address.postalOrZipCode);
      await animalsPages.privateTransporter.country.selectOption(transporter.address.country);
      await animalsPages.privateTransporter.phone.fill(transporter.address.telephoneNumber);
      await animalsPages.privateTransporter.email.fill(transporter.address.emailAddress);
      await animalsPages.privateTransporter.saveAndContinue.click();
      await expect(animalsPages.transporter.heading).toBeVisible();
      await animalsPages.transporter.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();

      const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
      await animalsJourney.openReviewFromOverview();
      await expect(
        animalsPages.notificationView.summaryValue(animalsPages.notificationView.summaryCard('Transport details'), 'Country'),
      ).toHaveText(transporter.address.country);
      await animalsPages.overview.open(referenceNumber);

      await animalsJourney.openTransporterFromOverview();
      await animalsJourney.chooseTransporterType('Private');
      await expect(animalsPages.privateTransporter.heading).toBeVisible();
      await expect(animalsPages.privateTransporter.name).toHaveValue(transporter.name);
      await expect(animalsPages.privateTransporter.country).toHaveValue(transporter.address.country);
      await animalsPages.privateTransporter.saveAndContinue.click();
      await expect(animalsPages.transporter.heading).toBeVisible();
      await animalsPages.transporter.saveAndContinue.click();

      await animalsJourney.openTransporterFromOverview();
      await animalsJourney.chooseTransporterType('Commercial');
      await expect(animalsPages.commercialTransporter.heading).toBeVisible();
      await animalsPages.commercialTransporter.cancelAndReturnToDashboard.click();
      await animalsPages.overview.open(referenceNumber);

      await animalsJourney.openTransporterFromOverview();
      await animalsJourney.chooseTransporterType('Private');
      await expect(animalsPages.privateTransporter.heading).toBeVisible();
      await expect(animalsPages.privateTransporter.name).toHaveValue(transporter.name);
      await expect(animalsPages.privateTransporter.country).toHaveValue(transporter.address.country);
    },
  );
});
