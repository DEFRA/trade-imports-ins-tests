import { escapeRegex } from '@page-objects/shared/escape-regex';
import { test, expect } from '@fixtures';
import { addressTypes } from '@domain/shared/constants/address-types';
import { transporterTypeOptions, transporterTypeQuestion, transporterTypes } from '@domain/ins/constants/transporter-types';

test.describe('Choosing Transporter on the address type question', () => {
  test('opens the transporter type question with its caption, heading, warning, both options with the commercial hint, and Continue, and Back returns to the address type question', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressTypeFromList();

    await insJourney.chooseAddressType(addressTypes.transporter);

    const typePage = insPages.transporterType;
    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(typePage.expectedUrl)}\\?start=true$`));
    await expect(typePage.caption).toBeVisible();
    await expect(typePage.heading).toBeVisible();
    await expect(typePage.warning).toBeVisible();
    await expect(typePage.radios).toHaveCount(transporterTypeOptions.length);
    for (const [index, { label, hint }] of transporterTypeOptions.entries()) {
      await expect(typePage.radios.nth(index)).toHaveAccessibleName(label);
      if (hint) {
        await expect(typePage.radios.nth(index)).toHaveAccessibleDescription(hint);
      }
    }
    await expect(typePage.btnContinue).toBeVisible();

    await typePage.linkBack.click();

    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(insPages.addressBookAddressType.expectedUrl)}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });

  test('opening the add address form with Transporter stored as the chosen type opens the address type question', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressType();
    await insPages.addressBookAddressType.choose(addressTypes.transporter);
    await insPages.addressBookAddressType.continue();
    await insPages.transporterType.heading.waitFor();

    await insPages.addressBookAdd.open();

    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(insPages.addressBookAddressType.expectedUrl)}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });

  test('continuing with nothing chosen keeps the trader on the page with the refusal against the options and in the summary, whose link focuses the first option', async ({
    insPages,
    insJourney,
  }) => {
    await insJourney.toTransporterType();
    const typePage = insPages.transporterType;

    await typePage.continue();

    await expect(typePage.errorSummary).toBeVisible();
    await expect(typePage.radioGroup).toHaveAccessibleDescription(`Error: ${transporterTypeQuestion.error}`);
    await typePage.errorSummaryLink(transporterTypeQuestion.error).click();
    await expect(typePage.radio(transporterTypes.private)).toBeFocused();
  });
});
