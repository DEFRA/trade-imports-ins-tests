import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { addressFormCountryNames } from '@resources/reference-data/reference-data';
import { skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { AnimalsJourney } from '@flows/animals/journey';
import { type InsAddressBookAddPage, type NewAddressDetails } from '@page-objects/ins/address-book/add-page';
import { FIELD_LABELS_IN_ORDER } from '@page-objects/ins/address-book/form-page';
import { AnimalsAddressesPage, type PartyRole } from '@page-objects/animals/addresses-page';

const insBaseUrl = (process.env.TRADE_IMPORTS_INS_FRONTEND_BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const insAddUrlPattern = new RegExp(`^${insBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/address-book/add\\?`);

const PARTY_ROLES: readonly PartyRole[] = ['Place of origin', 'Consignor', 'Consignee', 'Importer', 'Place of destination'];

function newAddressFor(role: PartyRole): NewAddressDetails {
  const unique = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  return {
    name: `Handshake ${role} ${unique}`,
    addressLine1: '9 Handshake Lane',
    townOrCity: 'Carlisle',
    postcode: 'CA2 7AA',
    country: 'United Kingdom',
    phone: '01228 555 0199',
    email: `handshake-${unique}@example.co.uk`,
  };
}

function addedBannerText(details: NewAddressDetails): string {
  return `${details.name} address added to your address book`;
}

async function arriveOnInsAddPageAndFill(
  animalsJourney: AnimalsJourney,
  addPage: InsAddressBookAddPage,
  role: PartyRole,
  details: NewAddressDetails,
): Promise<void> {
  await animalsJourney.toInsAddAddressFromPicker(addPage, role);
  await addPage.fill(details);
}

test.describe('Add an address from the journey via INS', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(() => {
    skipUnlessNonStubStackEnvironment(
      'the handshake crosses the animals and INS frontends, which both run on the compose stack and in CDP',
    );
  });

  for (const role of PARTY_ROLES) {
    test(
      `Save and select on the INS add page reached from the ${role} picker saves the address, selects it for the role and lands on Roles and addresses with the added banner`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, pages, animalsPages, insPages }) => {
        const addPage = insPages.addressBookAdd;
        const details = newAddressFor(role);

        await arriveOnInsAddPageAndFill(animalsJourney, addPage, role, details);
        await expect(pages.page).toHaveURL(insAddUrlPattern);
        await expect(addPage.linkBack).toBeVisible();
        await expect(addPage.btnSaveAndSelect).toBeVisible();
        await expect(addPage.btnSaveAndReturnToAddressPage).toBeVisible();
        await expect(addPage.linkCancelAndReturnToHub).toBeVisible();

        await addPage.btnSaveAndSelect.click();

        await expect(animalsPages.addresses.heading).toBeVisible();
        await expect(animalsPages.addresses.successBanner.getByText(addedBannerText(details), { exact: true })).toBeVisible();
        await expect(animalsPages.addresses.partyAddressLines(role)).toHaveText(AnimalsAddressesPage.expectedAddressText(details), {
          useInnerText: true,
        });
        await expect(animalsPages.addresses.changeParty(role)).toBeVisible();
      },
    );

    test(
      `Save and return to address page on the INS add page reached from the ${role} picker lands on the picker with the added banner, the new address listed first and nothing selected`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, insPages }) => {
        const addPage = insPages.addressBookAdd;
        const picker = animalsJourney.partyPicker(role);
        const details = newAddressFor(role);

        await arriveOnInsAddPageAndFill(animalsJourney, addPage, role, details);
        await addPage.btnSaveAndReturnToAddressPage.click();

        await expect(picker.heading).toBeVisible();
        await expect(picker.successBanner.getByText(addedBannerText(details), { exact: true })).toBeVisible();
        await expect(picker.party(details.name)).not.toBeChecked();
        expect((await picker.listedPartyNames())[0]).toBe(details.name);
      },
    );

    test(
      `Cancel and return to hub on the INS add page reached from the ${role} picker lands on the Overview and saves no address`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, animalsPages, insPages }) => {
        const addPage = insPages.addressBookAdd;
        const picker = animalsJourney.partyPicker(role);
        const details = newAddressFor(role);

        await arriveOnInsAddPageAndFill(animalsJourney, addPage, role, details);
        await addPage.linkCancelAndReturnToHub.click();

        await expect(animalsPages.overview.heading).toBeVisible();

        await animalsPages.overview.task('Roles and addresses').click();
        await expect(animalsPages.addresses.heading).toBeVisible();
        await expect(animalsPages.addresses.partyLinks(role)).toHaveText([AnimalsAddressesPage.addLinkName(role)]);

        await animalsPages.addresses.addParty(role).click();
        await expect(picker.heading).toBeVisible();
        await picker.searchBox.fill(details.name);
        await picker.searchButton.click();
        await expect(picker.noMatchesMessage).toBeVisible();
      },
    );
  }

  test(
    'Consignor: the added address banner is still shown ten seconds after Save and select and is gone after a reload',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, pages, animalsPages, insPages }) => {
      const addPage = insPages.addressBookAdd;

      await arriveOnInsAddPageAndFill(animalsJourney, addPage, 'Consignor', newAddressFor('Consignor'));
      await pages.page.clock.install();
      await addPage.btnSaveAndSelect.click();
      await expect(animalsPages.addresses.heading).toBeVisible();

      await pages.page.clock.runFor(10_000);
      await expect(animalsPages.addresses.successBanner).toBeVisible();

      await pages.page.reload();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.successBanner).toHaveCount(0);
    },
  );

  test(
    'Back on the INS add page reached from the Consignor picker lands on the Consignor picker',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages }) => {
      const addPage = insPages.addressBookAdd;

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignor');
      await addPage.linkBack.click();

      await expect(animalsJourney.partyPicker('Consignor').heading).toBeVisible();
    },
  );

  test(
    'the INS add page reached from the consignor picker shows the design page frame, the journey status, the field labels and autocomplete hints',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, journeyContext, pages, insPages }) => {
      const addPage = insPages.addressBookAdd;
      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignor');

      await expect(pages.page).toHaveTitle('Add address and contact details - Import notification service - GOV.UK');
      await expect(addPage.heading).toBeVisible();
      await expect(addPage.caption).toBeVisible();
      await expect(addPage.statusTag).toHaveText('Draft');
      await expect(addPage.notificationReference).toHaveText(journeyContext.referenceNumber);
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
    'the INS add page reached from the consignee picker offers United Kingdom alone, already selected',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages }) => {
      const addPage = insPages.addressBookAdd;

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');

      await expect(addPage.countryOptionsIncludingPlaceholder).toHaveText(['United Kingdom']);
      await expect(addPage.selectedCountryOption).toHaveText('United Kingdom');
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
        await expect(addPage.countryOptionsIncludingPlaceholder).toHaveText(['Select a country', ...addressFormCountryNames]);
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
      await addPage.btnSaveAndSelect.click();

      await expect(addPage.heading).toBeVisible();
      await expect(addPage.errorSummaryLink(blankNameMessage)).toBeVisible();
      await expect(addPage.inputName).toHaveAccessibleDescription(`Error: ${blankNameMessage}`);
    },
  );
});
