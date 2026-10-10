import { test, expect } from '@fixtures';
import { getRelativeDatePickerValue } from '@utils/date-utils';

const PORT_OPTION = 'Port of Dover - GB DVR';
const PORT_CODE = 'GB DVR';

test.describe('Port of entry type-ahead', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('enhances the select, filters by name or code, submits and persists the code', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.toArrivalDetails();
    const journeyId = animalsPages.arrivalDetails.journeyIdFromUrl();

    const combobox = animalsPages.arrivalDetails.portOfEntry;
    await expect(combobox).toBeVisible();
    await expect(combobox).toHaveRole('combobox');
    await expect(combobox).toHaveAccessibleName('Port of entry');

    // Focusing shows the whole list (showAllValues) before any typing.
    await combobox.click();
    await expect(pages.page.getByRole('option', { name: PORT_OPTION, exact: true })).toBeVisible();

    // Filtering by the port code works because the code is part of the label.
    await combobox.fill('gb dvr');
    await expect(pages.page.getByRole('option', { name: PORT_OPTION, exact: true })).toBeVisible();

    // The native option a user without JavaScript picks reads the same.
    await expect(animalsPages.arrivalDetails.portOption(PORT_CODE)).toHaveText(PORT_OPTION);

    // Selecting the option puts the label in the field and the code in the
    // native select that submits.
    await animalsPages.arrivalDetails.selectPort(PORT_OPTION);
    await expect(combobox).toHaveValue(PORT_OPTION);
    await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ monthOffset: 1 }));
    await animalsPages.arrivalDetails.meansOfTransport.selectOption({ label: 'Air' });
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.arrivalDetails.open(journeyId);
    await expect(animalsPages.arrivalDetails.portOfEntryValue).toHaveValue(PORT_CODE);
  });
});
