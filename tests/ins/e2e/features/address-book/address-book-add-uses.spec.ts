import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER, ADDRESS_FORM_VALIDATION_MESSAGES } from '@domain/ins/constants/address-form';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { addressUses, classificationOf } from '@domain/shared/constants/address-types';
import {
  addressBookTabs,
  addressTypeLabels,
  addressTypesRequiringUnitedKingdom,
  usesQuestion,
  usesQuestionLabels,
  usesQuestionLegends,
  usesQuestionOptions,
} from '@domain/ins/constants/address-book-types';
import { expectAbove } from './expect-above';
import { usesLabelOf } from './stamped-addresses';

const UNITED_KINGDOM = 'United Kingdom';

test.describe('Adding an address with its uses', () => {
  test('an address saved with Consignor ticked is found by searching Consignor, and one saved with only Place of origin ticked is not', async ({
    insPages,
    insJourney,
  }) => {
    const stamp = Date.now();
    const consignorName = `Label Use Farm ${stamp}`;
    const placeOfOriginName = `Label Use Farm ${stamp} Other`;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(consignorName, UNITED_KINGDOM), {
      uses: [addressUses.consignor],
    });
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(placeOfOriginName, UNITED_KINGDOM), {
      uses: [addressUses.placeOfOrigin],
    });

    await expect(async () => {
      await insPages.addressBookList.search(usesQuestionLabels[addressUses.consignor], { submitWith: 'button' });

      expect(await insPages.addressBookList.followResultPagesUntilRowShows(consignorName)).toBe(true);
    }).toPass({ timeout: timeouts.medium });

    await insPages.addressBookList.search(usesQuestionLabels[addressUses.consignor], { submitWith: 'button' });

    expect(await insPages.addressBookList.followResultPagesUntilRowShows(placeOfOriginName)).toBe(false);
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
      test('opens the Country select on Select a country first with United Kingdom selected', async ({ insPages, insJourney }) => {
        await insJourney.toAddressForm({ addressType });

        await expect(insPages.addressBookAdd.countryOptions.first()).toHaveText('Select a country');
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

      await expect(addPage.errorSummary.getByRole('link')).toHaveText([ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired]);
      await expect(addPage.usesInlineError).toHaveCount(0);
    });

    test('ticking every offered use and saving lands on its tab, lists the address with its uses, and stores its type, its uses and its country', async ({
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
      await expect(insPages.addressBookList.usesCell(name)).toHaveText(usesLabelOf(stored.uses ?? []));
      const { uses, ...storedClassification } = classificationOf(stored);
      expect({ ...storedClassification, uses: [...(uses ?? [])].sort(), countryCode: stored.countryCode }).toEqual({
        addressType,
        uses: [...offeredUses].sort(),
        countryCode: 'GB',
      });
    });
  });
}
