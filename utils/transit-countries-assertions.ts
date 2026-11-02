import { expect } from '@fixtures';
import type { AnimalsTransitedCountriesPage } from '@page-objects/animals/transited-countries-page';
import { EMPTY_TRANSIT_COUNTRIES_BODY_TEXT, EMPTY_TRANSIT_COUNTRIES_BUTTONS } from '@domain/animals/constants/transit-countries-page';

export const expectEmptyTransitList = async (transitedCountries: AnimalsTransitedCountriesPage): Promise<void> => {
  await expect(transitedCountries.bodyParagraphs).toHaveText(EMPTY_TRANSIT_COUNTRIES_BODY_TEXT);
  await expect(transitedCountries.formButtons).toHaveText(EMPTY_TRANSIT_COUNTRIES_BUTTONS);
};
