import { test, expect } from '@fixtures';
import { expectRolesOptions } from '@utils/roles-options-assertions';
import { ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER, ADDRESS_FORM_VALIDATION_MESSAGES } from '@domain/ins/constants/address-form';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import {
  addressTypeLabels,
  roleBackedAddressBookTabs,
  rolesLabelOf,
  rolesQuestion,
  rolesQuestionLegends,
  rolesQuestionOptions,
} from '@domain/ins/constants/address-book-types';
import { expectAbove } from './expect-above';

const UNITED_KINGDOM = 'United Kingdom';

test.describe('The Country select on the add form', () => {
  for (const { addressType } of roleBackedAddressBookTabs) {
    test(`a ${addressTypeLabels[addressType]} address lists Select a country first and opens with United Kingdom selected`, async ({
      insPages,
      insJourney,
    }) => {
      await insJourney.toAddressForm({ addressType });

      await expect(insPages.addressBookAdd.countryOptions.first()).toHaveText('Select a country');
      await expect(insPages.addressBookAdd.selectedCountryOption).toHaveText(UNITED_KINGDOM);
    });
  }
});

for (const tab of roleBackedAddressBookTabs) {
  const { addressType } = tab;
  const addressTypeLabel = addressTypeLabels[addressType];
  const offeredRoles = rolesQuestionOptions[addressType];
  const legend = rolesQuestionLegends[addressType];

  test.describe(`Adding a ${addressTypeLabel} address`, () => {
    test('opens the form with only the address and contact text fields, a section break, and the roles question with its legend, hint and options', async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;

      await insJourney.toAddressForm({ addressType });

      await expect(addPage.textboxes).toHaveCount(ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER.length);
      await expect(addPage.sectionBreak).toHaveCount(1);
      await expectAbove(addPage.inputPhone, addPage.sectionBreak);
      await expect(addPage.rolesGroup(legend)).toBeVisible();
      await expectAbove(addPage.sectionBreak, addPage.rolesGroup(legend));
      await expect(addPage.rolesGroup(legend)).toHaveAccessibleDescription(rolesQuestion.hint);
      await expectRolesOptions(addPage, legend, offeredRoles);
      for (const role of offeredRoles) {
        await expect(addPage.rolesOption(role)).toHaveAccessibleDescription('');
      }
    });

    test('saving valid fields with no role shows the roles error against the question and in the summary, whose link focuses the first option', async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;
      await insJourney.toAddressForm({ addressType });
      await addPage.fill(addFormAddressWithLineTwoAndCounty(`No Role ${addressTypeLabel} ${Date.now()}`, UNITED_KINGDOM));

      await addPage.saveAndContinue();

      await expect(addPage.errorSummary).toBeVisible();
      await expect(addPage.rolesGroup(legend)).toHaveAccessibleDescription(`${rolesQuestion.hint} Error: ${rolesQuestion.error}`);
      await addPage.errorSummaryLink(rolesQuestion.error).click();
      await expect(addPage.rolesOption(offeredRoles[0])).toBeFocused();
    });

    test('saving with an invalid field and no role shows the field error and the roles error together, in page order', async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;
      await insJourney.toAddressForm({ addressType });
      await addPage.fill({
        ...addFormAddressWithLineTwoAndCounty(`Invalid Field ${addressTypeLabel} ${Date.now()}`, UNITED_KINGDOM),
        name: '',
      });

      await addPage.saveAndContinue();

      await expect(addPage.errorSummaryLinks).toHaveText([ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired, rolesQuestion.error]);
      await expect(addPage.rolesGroup(legend)).toHaveAccessibleDescription(`${rolesQuestion.hint} Error: ${rolesQuestion.error}`);
    });

    test('ticking every offered role and saving lands on its tab, lists the address with its roles, and stores its roles and its country', async ({
      pages,
      insPages,
      insJourney,
      addressBookApi,
    }) => {
      const name = `All Roles ${addressTypeLabel} ${Date.now()}`;

      await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM), { addressType, roles: offeredRoles });

      await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(tab));
      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await insPages.addressBookList.search(name, { submitWith: 'button' });
      await expect(insPages.addressBookList.viewLinks.first()).toHaveText(`View ${name}`);
      const stored = await addressBookApi.findByName(name);
      await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabelOf(stored.roles));
      expect({ roles: [...stored.roles].sort(), countryCode: stored.countryCode }).toEqual({
        roles: [...offeredRoles].sort(),
        countryCode: 'GB',
      });
    });
  });
}
