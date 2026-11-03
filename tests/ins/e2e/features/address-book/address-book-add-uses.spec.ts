import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER } from '@domain/ins/constants/address-form';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import {
  addressBookTabs,
  addressTypeLabels,
  addressTypesRequiringUnitedKingdom,
  addressUses,
  usesQuestion,
  usesQuestionLabels,
  usesQuestionLegends,
  usesQuestionOptions,
} from '@domain/shared/constants/address-types';
import { expectAbove } from './expect-above';
import { typeLabelOf } from './stamped-addresses';

const UNITED_KINGDOM = 'United Kingdom';
const NAME_REQUIRED = 'Enter a name or organisation';

test.describe('Adding an address with its uses', () => {
  test('an address saved with Consignor ticked is found by searching Consignor', async ({ insPages, insJourney }) => {
    const name = `Consignor Search Farm ${Date.now()}`;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM), { uses: [addressUses.consignor] });

    await expect(async () => {
      await insPages.addressBookList.search(usesQuestionLabels[addressUses.consignor], { submitWith: 'button' });

      expect(await insPages.addressBookList.followResultPagesUntilRowShows(name)).toBe(true);
    }).toPass({ timeout: timeouts.medium });
  });
});

for (const tab of addressBookTabs) {
  const { addressType } = tab;
  const label = addressTypeLabels[addressType];
  const offeredUses = usesQuestionOptions[addressType];

  test.describe(`Adding a ${label} address`, () => {
    test('opens the form with only the address and contact text fields, a section break, and the uses question with its legend, hint and options', async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;

      await insJourney.toAddressForm({ addressType });

      await expect(addPage.textboxes).toHaveCount(ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER.length);
      await expect(addPage.sectionBreak).toHaveCount(1);
      await expectAbove(addPage.inputPhone, addPage.sectionBreak);
      await expectAbove(addPage.sectionBreak, addPage.usesGroup);
      await expect(addPage.usesLegend).toHaveText(usesQuestionLegends[addressType]);
      await expect(addPage.usesGroup).toHaveAccessibleDescription(usesQuestion.hint);
      await expect(addPage.usesOptionLabels).toHaveText(offeredUses.map((use) => usesQuestionLabels[use]));
      await expect(addPage.usesOptionHints).toHaveCount(0);
    });

    if (addressTypesRequiringUnitedKingdom.includes(addressType)) {
      test('opens the Country select offering United Kingdom alone, selected', async ({ insPages, insJourney }) => {
        await insJourney.toAddressForm({ addressType });

        await expect(insPages.addressBookAdd.countryOptions).toHaveText([UNITED_KINGDOM]);
        await expect(insPages.addressBookAdd.selectedCountryOption).toHaveText(UNITED_KINGDOM);
      });
    } else {
      test('opens the Country select with United Kingdom selected', async ({ insPages, insJourney }) => {
        await insJourney.toAddressForm({ addressType });

        await expect(insPages.addressBookAdd.selectedCountryOption).toHaveText(UNITED_KINGDOM);
      });
    }

    test('saving valid fields with no use shows the uses error against the question and in the summary, whose link focuses the first option', async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;
      await insJourney.toAddressForm({ addressType });
      await addPage.fill(addFormAddressWithLineTwoAndCounty(`No Use ${label} ${Date.now()}`, UNITED_KINGDOM));

      await addPage.saveAndContinue();

      await expect(addPage.errorSummary).toBeVisible();
      await expect(addPage.usesInlineError).toContainText(usesQuestion.error);
      await addPage.errorSummaryLink(usesQuestion.error).click();
      await expect(addPage.usesOption(offeredUses[0])).toBeFocused();
    });

    test('saving with an invalid field and no use shows only the field error', async ({ insPages, insJourney }) => {
      const addPage = insPages.addressBookAdd;
      await insJourney.toAddressForm({ addressType });
      await addPage.fill({ ...addFormAddressWithLineTwoAndCounty(`Invalid Field ${label} ${Date.now()}`, UNITED_KINGDOM), name: '' });

      await addPage.saveAndContinue();

      await expect(addPage.errorSummary.getByRole('link')).toHaveText([NAME_REQUIRED]);
      await expect(addPage.usesInlineError).toHaveCount(0);
    });

    test('ticking every offered use and saving lands on its tab, lists the address with its Type, and stores its type, its uses and its country', async ({
      pages,
      insPages,
      insJourney,
      addressBookApi,
    }) => {
      const name = `All Uses ${label} ${Date.now()}`;

      await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM), { addressType, uses: offeredUses });

      await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrl(tab));
      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await insPages.addressBookList.search(name, { submitWith: 'button' });
      await expect(insPages.addressBookList.viewLinks.first()).toHaveText(`View ${name}`);
      const stored = await addressBookApi.findByName(name);
      await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabelOf(stored.uses ?? []));
      expect({ addressType: stored.addressType, uses: [...(stored.uses ?? [])].sort(), countryCode: stored.countryCode }).toEqual({
        addressType,
        uses: [...offeredUses].sort(),
        countryCode: 'GB',
      });
    });
  });
}
