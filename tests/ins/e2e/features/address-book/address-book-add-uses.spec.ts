import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER } from '@domain/ins/constants/address-form';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { addressTypes, addressUses, originOrConsignorTab, usesQuestion, usesQuestionLabels } from '@domain/shared/constants/address-types';
import { expectAbove } from './expect-above';
import { typeLabelOf } from './stamped-addresses';

const UNITED_KINGDOM = 'United Kingdom';
const NAME_REQUIRED = 'Enter a name or organisation';

test.describe('Adding an address with its uses', () => {
  test('Origin or Consignor opens the form with no address search, then a section break and the uses question offering Place of origin and Consignor without hints', async ({
    insPages,
    insJourney,
  }) => {
    const addPage = insPages.addressBookAdd;

    await insJourney.toAddressForm({ addressType: addressTypes.originOrConsignor });

    await expect(addPage.textboxes).toHaveCount(ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER.length);
    await expect(addPage.sectionBreak).toHaveCount(1);
    await expectAbove(addPage.inputPhone, addPage.sectionBreak);
    await expectAbove(addPage.sectionBreak, addPage.usesGroup);
    await expect(addPage.usesGroup).toHaveAccessibleDescription(usesQuestion.hint);
    await expect(addPage.usesOptionLabels).toHaveText([
      usesQuestionLabels[addressUses.placeOfOrigin],
      usesQuestionLabels[addressUses.consignor],
    ]);
    await expect(addPage.usesOptionHints).toHaveCount(0);
  });

  test('saving valid fields with no use shows the uses error against the question and in the summary, whose link focuses Place of origin', async ({
    insPages,
    insJourney,
  }) => {
    const addPage = insPages.addressBookAdd;
    await insJourney.toAddressForm();
    await addPage.fill(addFormAddressWithLineTwoAndCounty(`No Use Farm ${Date.now()}`, UNITED_KINGDOM));

    await addPage.saveAndContinue();

    await expect(addPage.errorSummary).toBeVisible();
    await expect(addPage.usesInlineError).toContainText(usesQuestion.error);
    await addPage.errorSummaryLink(usesQuestion.error).click();
    await expect(addPage.usesOption(addressUses.placeOfOrigin)).toBeFocused();
  });

  test('saving with an invalid field and no use shows only the field error', async ({ insPages, insJourney }) => {
    const addPage = insPages.addressBookAdd;
    await insJourney.toAddressForm();
    await addPage.fill({ ...addFormAddressWithLineTwoAndCounty(`Invalid Field Farm ${Date.now()}`, UNITED_KINGDOM), name: '' });

    await addPage.saveAndContinue();

    await expect(addPage.errorSummary.getByRole('link')).toHaveText([NAME_REQUIRED]);
    await expect(addPage.usesInlineError).toHaveCount(0);
  });

  test('ticking Place of origin and Consignor and saving lands on the Origin and Consignor tab with the address first, its Type listing both uses, and both stored in order', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Both Uses Farm ${Date.now()}`;

    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM), {
      uses: [addressUses.placeOfOrigin, addressUses.consignor],
    });

    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrl(originOrConsignorTab));
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expect(insPages.addressBookList.viewLinks.first()).toHaveText(`View ${name}`);
    await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabelOf([addressUses.placeOfOrigin, addressUses.consignor]));
    const stored = await addressBookApi.findByName(name);
    expect({ addressType: stored.addressType, uses: stored.uses }).toEqual({
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.placeOfOrigin, addressUses.consignor],
    });
  });

  test('an address saved with Consignor ticked is found by searching Consignor', async ({ insPages, insJourney }) => {
    const name = `Consignor Search Farm ${Date.now()}`;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM), { uses: [addressUses.consignor] });

    await expect(async () => {
      await insPages.addressBookList.search(usesQuestionLabels[addressUses.consignor], { submitWith: 'button' });

      expect(await insPages.addressBookList.followResultPagesUntilRowShows(name)).toBe(true);
    }).toPass({ timeout: timeouts.medium });
  });
});
