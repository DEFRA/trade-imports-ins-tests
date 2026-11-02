import { test, expect } from '@fixtures';
import { getRelativeDatePickerValue } from '@utils/date-utils';
import { pointOfEntries } from '@domain/animals/constants/point-of-entries';

const PORT_OPTION = pointOfEntries.aberdeenHarbour.display;
const PORT_CODE = pointOfEntries.aberdeenHarbour.value;

test.describe('Port of entry type-ahead', { tag: '@duplicated-in-frontend' }, () => {
  test('enhances the select, filters by name or code, submits and persists the code', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toArrivalDetails();
    const referenceNumber = animalsPages.arrivalDetails.referenceNumberFromUrl();

    const combobox = animalsPages.arrivalDetails.portOfEntry.field;
    await expect(combobox).toBeVisible();
    await expect(combobox).toHaveRole('combobox');
    await expect(combobox).toHaveAccessibleName('Port of entry');

    await combobox.click();
    await expect(animalsPages.arrivalDetails.portOfEntry.option(PORT_OPTION)).toBeVisible();

    await combobox.fill('gb abd');
    await expect(animalsPages.arrivalDetails.portOfEntry.option(PORT_OPTION)).toBeVisible();

    await animalsPages.arrivalDetails.portOfEntry.choose(PORT_OPTION);
    await expect(combobox).toHaveValue(PORT_OPTION);
    await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ monthOffset: 1 }));
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.arrivalDetails.open(referenceNumber);
    await expect(animalsPages.arrivalDetails.portOfEntry.select).toHaveValue(PORT_CODE);
  });
});
