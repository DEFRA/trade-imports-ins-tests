import { expect } from '@fixtures';
import type { InsAddressBookAddPage } from '@page-objects/ins/address-book/add-page';
import type { AddressUse } from '@domain/shared/constants/address-types';
import { usesQuestionLabels } from '@domain/ins/constants/address-book-types';

export const expectUsesOptions = async (addPage: InsAddressBookAddPage, legend: string, uses: readonly AddressUse[]): Promise<void> => {
  const options = addPage.usesOptions(legend);
  await expect(options).toHaveCount(uses.length);
  for (const [index, use] of uses.entries()) {
    await expect(options.nth(index)).toHaveAccessibleName(usesQuestionLabels[use]);
  }
};
