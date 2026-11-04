import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { addressFormCountryNames } from '@resources/reference-data/reference-data';
import { skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { AnimalsJourney } from '@flows/animals/journey';
import { type InsAddressBookAddPage, type NewAddressDetails } from '@page-objects/ins/address-book/add-page';
import { ADDRESS_FORM_FIELD_LABELS_IN_ORDER, ADDRESS_FORM_VALIDATION_MESSAGES } from '@domain/ins/constants/address-form';
import { journeyUsesQuestion, usesQuestionLabels } from '@domain/ins/constants/address-book-types';
import {
  addressTypes,
  addressUses,
  heldAsConsignee,
  heldAsConsignor,
  heldAsImporter,
  heldAsPlaceOfDestination,
  heldAsPlaceOfOrigin,
  classificationOf,
  type AddressClassification,
} from '@domain/shared/constants/address-types';
import { AnimalsAddressesPage, type PartyRole } from '@page-objects/animals/addresses-page';
import { requireBaseUrl } from '@page-objects/shared/base-page';

const PARTY_ROLES: readonly PartyRole[] = ['Place of origin', 'Consignor', 'Consignee', 'Importer', 'Place of destination'];

const CLASSIFICATION_BY_ROLE: Record<PartyRole, AddressClassification> = {
  'Place of origin': heldAsPlaceOfOrigin,
  Consignor: heldAsConsignor,
  Consignee: heldAsConsignee,
  Importer: heldAsImporter,
  'Place of destination': heldAsPlaceOfDestination,
};

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
  test.beforeEach(() => {
    skipUnlessNonStubStackEnvironment(
      'the handshake crosses the animals and INS frontends, which both run on the compose stack and in CDP',
    );
  });

  for (const role of PARTY_ROLES) {
    test(
      `Save and select on the INS add page reached from the ${role} picker saves the address with the role's type and use, selects it for the role and lands on Roles and addresses with the added banner`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, pages, animalsPages, insPages, addressBookApi }) => {
        const addPage = insPages.addressBookAdd;
        const details = newAddressFor(role);
        const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

        await arriveOnInsAddPageAndFill(animalsJourney, addPage, role, details);
        await expect(pages.page).toHaveURL((url) => url.origin === insOrigin && url.pathname === '/address-book/add' && url.search !== '');
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

        const saved = await addressBookApi.findByName(details.name);
        expect(classificationOf(saved)).toEqual(CLASSIFICATION_BY_ROLE[role]);
      },
    );

    test(
      `Save and return to address page on the INS add page reached from the ${role} picker lands on the picker with the added banner, the new address listed first and nothing selected`,
      { tag: ['@address-book', '@ins-frontend'] },
      async ({ animalsJourney, insPages }) => {
        const addPage = insPages.addressBookAdd;
        const picker = animalsJourney.partyPicker(role);
        const details = newAddressFor(role);

        await animalsJourney.toPartyPicker(role);
        const partyIdsListedBeforeTheAdd = await picker.listedPartyIds();
        await animalsJourney.openInsAddAddressFromPicker(addPage, role);
        await addPage.fill(details);
        await addPage.btnSaveAndReturnToAddressPage.click();

        await expect(picker.heading).toBeVisible();
        await expect(picker.successBanner.getByText(addedBannerText(details), { exact: true })).toBeVisible();
        await expect(picker.party(details.name)).toHaveCount(1);
        await expect(picker.party(details.name)).not.toBeChecked();
        await expect(picker.partiesListedAbove(details.name, partyIdsListedBeforeTheAdd)).toHaveCount(0);
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
    'Save and select on the INS add page reached from the Consignor picker shows the added banner, which is still shown ten seconds later and is gone after a reload',
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
    'the INS add page reached from the Consignor picker shows its page title, heading, caption, Draft status, notification reference, section headings, field labels and autocomplete hints',
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
      await expect(addPage.fieldLabels).toHaveText([...ADDRESS_FORM_FIELD_LABELS_IN_ORDER, usesQuestionLabels.PLACE_OF_ORIGIN]);
      await expect(addPage.inputName).not.toHaveAttribute('autocomplete');
      await expect(addPage.inputAddressLine1).toHaveAttribute('autocomplete', 'address-line1');
      await expect(addPage.inputAddressLine2).toHaveAttribute('autocomplete', 'address-line2');
      await expect(addPage.inputTownOrCity).toHaveAttribute('autocomplete', 'address-level2');
      await expect(addPage.inputPostcode).toHaveAttribute('autocomplete', 'postal-code');
      await expect(addPage.inputEmail).toHaveAttribute('autocomplete', 'email');
      await expect(addPage.inputPhone).toHaveAttribute('autocomplete', 'tel');
    },
  );

  test(
    'the INS add page reached from the Consignee picker offers United Kingdom alone, already selected',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages }) => {
      const addPage = insPages.addressBookAdd;

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');

      await expect(addPage.countryOptions).toHaveText(['United Kingdom']);
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
        await expect(addPage.countryOptions).toHaveText(['Select a country', ...addressFormCountryNames]);
      },
    );
  }

  test(
    'Save and select on the INS add page reached from the Consignee picker with Importer ticked saves the address under the destination type with the consignee and importer uses',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, animalsPages, insPages, addressBookApi }) => {
      const addPage = insPages.addressBookAdd;
      const details = newAddressFor('Consignee');

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');
      await expect(addPage.usesGroup(journeyUsesQuestion.legend)).toHaveAccessibleDescription(journeyUsesQuestion.consigneeHint);
      await addPage.expectUsesOptions(journeyUsesQuestion.legend, [addressUses.importer, addressUses.placeOfDestination]);
      await expect(addPage.usesOption(addressUses.importer)).not.toBeChecked();
      await expect(addPage.usesOption(addressUses.placeOfDestination)).not.toBeChecked();

      await addPage.fill(details);
      await addPage.tickUses([addressUses.importer]);
      await addPage.btnSaveAndSelect.click();

      await expect(animalsPages.addresses.heading).toBeVisible();
      const saved = await addressBookApi.findByName(details.name);
      expect(classificationOf(saved)).toEqual({
        addressType: addressTypes.destinationConsigneeOrImporter,
        uses: [addressUses.consignee, addressUses.importer],
      });
    },
  );

  test(
    'Save and return to address page on the INS add page reached from the Consignee picker with answers missing keeps the page, lists each error in field order, keeps the name and the Importer tick and saves nothing',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages, addressBookApi }) => {
      const addPage = insPages.addressBookAdd;
      const details = newAddressFor('Consignee');

      await animalsJourney.toInsAddAddressFromPicker(addPage, 'Consignee');
      await addPage.fill({ ...details, addressLine1: '', townOrCity: '', postcode: '', email: '', phone: '' });
      await addPage.tickUses([addressUses.importer]);
      await addPage.btnSaveAndReturnToAddressPage.click();

      await expect(addPage.heading).toBeVisible();
      await expect(addPage.errorSummaryLinks).toHaveText([
        ADDRESS_FORM_VALIDATION_MESSAGES.addressLine1Required,
        ADDRESS_FORM_VALIDATION_MESSAGES.townOrCityRequired,
        ADDRESS_FORM_VALIDATION_MESSAGES.postcodeRequired,
        ADDRESS_FORM_VALIDATION_MESSAGES.emailRequired,
        ADDRESS_FORM_VALIDATION_MESSAGES.phoneRequired,
      ]);
      await expect(addPage.inputName).toHaveValue(details.name);
      await expect(addPage.usesOption(addressUses.importer)).toBeChecked();
      expect(await addressBookApi.listAddresses(details.name)).toEqual([]);
    },
  );

  test(
    'saving the INS add page with a blank name keeps the page with the name error in the summary and on the field',
    { tag: ['@address-book', '@ins-frontend'] },
    async ({ animalsJourney, insPages }) => {
      const addPage = insPages.addressBookAdd;

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
      await expect(addPage.errorSummaryLink(ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired)).toBeVisible();
      await expect(addPage.inputName).toHaveAccessibleDescription(`Error: ${ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired}`);
    },
  );
});
