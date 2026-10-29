import { test, expect } from '@fixtures';
import { addFormCountryNames } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { type NewAddressDetails } from '@page-objects/ins/address-book/add-page';
import { FIELD_LABELS_IN_ORDER } from '@page-objects/ins/address-book/form-page';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

const insBaseUrl = (process.env.TRADE_IMPORTS_INS_FRONTEND_BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const insAddUrlPattern = new RegExp(`^${insBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/address-book/add\\?`);

test.describe('Add an address from the journey via INS', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the handshake crosses animals-frontend and ins-frontend, which only the compose stack runs together');
  });

  test(
    'saving a new address in INS returns to the picker with it selected and committed',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, pages, animalsPages, insPages }) => {
      const stamp = Date.now();
      const farmName = `Handshake Farm ${stamp}`;
      const details: NewAddressDetails = {
        name: farmName,
        addressLine1: '9 Handshake Lane',
        townOrCity: 'Carlisle',
        postcode: 'CA2 7AA',
        country: 'United Kingdom',
        phone: '01228 555 0199',
        email: `handshake-${stamp}@example.co.uk`,
      };

      const referenceNumber = await animalsJourney.toInsAddAddressFromPicker(insPages.addressBookAdd, 'Consignor');
      await expect(pages.page).toHaveURL(insAddUrlPattern);

      await animalsJourney.saveInsAddressAndPickIt(insPages.addressBookAdd, 'Consignor', details, referenceNumber);

      await expect(animalsPages.consignorSelection.heading).toBeVisible();
      await expect(animalsPages.consignorSelection.party(farmName)).toBeChecked();

      await animalsPages.consignorSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Consignor')).toHaveText(AnimalsAddressesPage.expectedAddressText(details), {
        useInnerText: true,
      });
    },
  );

  test(
    'the INS add page reached from the consignor picker shows the design page frame, the journey status, the field labels and autocomplete hints',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, pages, insPages }) => {
      const referenceNumber = await animalsJourney.toInsAddAddressFromPicker(insPages.addressBookAdd, 'Consignor');
      const addPage = insPages.addressBookAdd;

      await expect(pages.page).toHaveTitle('Add address and contact details - Import notification service - GOV.UK');
      await expect(addPage.heading).toBeVisible();
      await expect(addPage.caption).toBeVisible();
      await expect(addPage.statusTag).toHaveText('Draft');
      await expect(addPage.notificationReference).toHaveText(referenceNumber);
      await expect(addPage.sectionHeading('Address')).toBeVisible();
      await expect(addPage.sectionHeading('Contact details')).toBeVisible();
      await expect(addPage.fieldLabels).toHaveText(FIELD_LABELS_IN_ORDER);
      await expect(addPage.inputName).toHaveAttribute('autocomplete', 'organization');
      await expect(addPage.inputAddressLine1).toHaveAttribute('autocomplete', 'address-line1');
      await expect(addPage.inputAddressLine2).toHaveAttribute('autocomplete', 'address-line2');
      await expect(addPage.inputTownOrCity).toHaveAttribute('autocomplete', 'address-level2');
      await expect(addPage.inputPostcode).toHaveAttribute('autocomplete', 'postal-code');
      await expect(addPage.inputEmail).toHaveAttribute('autocomplete', 'email');
      await expect(addPage.inputPhone).toHaveAttribute('autocomplete', 'tel');
    },
  );

  test(
    'the INS add page reached from the consignee picker offers United Kingdom alone, and the saved address reads United Kingdom on Roles and addresses',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, animalsPages, insPages }) => {
      const stamp = Date.now();
      const consigneeName = `Handshake Consignee ${stamp}`;
      const details: NewAddressDetails = {
        name: consigneeName,
        addressLine1: '12 Handshake Row',
        townOrCity: 'Carlisle',
        postcode: 'CA2 7AB',
        country: 'United Kingdom',
        phone: '01228 555 0198',
        email: `consignee-${stamp}@example.co.uk`,
      };
      const addPage = insPages.addressBookAdd;

      const referenceNumber = await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');

      await expect(addPage.countryOptionsIncludingPlaceholder).toHaveText(['United Kingdom']);
      await expect(addPage.selectedCountryOption).toHaveText('United Kingdom');
      await expect(addPage.fieldLabels).toHaveText(FIELD_LABELS_IN_ORDER);

      await animalsJourney.saveInsAddressAndPickIt(addPage, 'Consignee', details, referenceNumber);
      await expect(animalsPages.consigneeSelection.party(consigneeName)).toBeChecked();

      await animalsPages.consigneeSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Consignee')).toHaveText(AnimalsAddressesPage.expectedAddressText(details), {
        useInnerText: true,
      });
    },
  );

  for (const role of ['Place of origin', 'Consignor'] as const) {
    test(
      `the INS add page reached from the ${role} picker opens on Select a country and offers every captured country, alphabetically, as a plain select`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, insPages }) => {
        const addPage = insPages.addressBookAdd;

        await animalsJourney.toInsAddAddressFromPicker(addPage, role);

        await expect(addPage.selectCountry).toHaveJSProperty('tagName', 'SELECT');
        await expect(addPage.selectCountry).toHaveValue('');
        await expect(addPage.countryOptionsIncludingPlaceholder).toHaveText(['Select a country', ...addFormCountryNames]);
      },
    );
  }

  test(
    'saving the INS add page with a blank name keeps the page with the name error in the summary and on the field',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages }) => {
      const addPage = insPages.addressBookAdd;
      const blankNameMessage = 'Enter a name or organisation';

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');

      await addPage.fill({
        name: '',
        addressLine1: '12 Handshake Row',
        townOrCity: 'Carlisle',
        postcode: 'CA2 7AB',
        country: 'United Kingdom',
        phone: '01228 555 0198',
        email: 'blank-name@example.co.uk',
      });
      await addPage.save();

      await expect(addPage.heading).toBeVisible();
      await expect(addPage.errorSummaryLink(blankNameMessage)).toBeVisible();
      await expect(addPage.inputName).toHaveAccessibleDescription(`Error: ${blankNameMessage}`);
    },
  );

  test(
    'cancelling INS add returns to the picker without saving an address',
    { tag: '@ins-frontend' },
    async ({ animalsJourney, pages, animalsPages, insPages }) => {
      const referenceNumber = await animalsJourney.toInsAddAddressFromPicker(insPages.addressBookAdd, 'Consignor');

      await insPages.addressBookAdd.btnCancelFromJourney.click();
      await expect(pages.page).toHaveURL((url) => url.pathname === animalsPages.consignorSelection.expectedUrl(referenceNumber), {
        timeout: 15_000,
      });

      await expect(animalsPages.consignorSelection.heading).toBeVisible();

      await animalsPages.consignorSelection.linkBack.click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyLinks('Consignor')).toHaveText([AnimalsAddressesPage.addLinkName('Consignor')]);
    },
  );
});
