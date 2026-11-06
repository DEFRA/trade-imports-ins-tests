import { expect } from '@fixtures';
import type { InsAddressBookAddPage } from '@page-objects/ins/address-book/add-page';
import type { AddressRole } from '@domain/shared/constants/address-types';
import { rolesQuestionLabels } from '@domain/ins/constants/address-book-types';

export const expectRolesOptions = async (addPage: InsAddressBookAddPage, legend: string, roles: readonly AddressRole[]): Promise<void> => {
  const options = addPage.rolesOptions(legend);
  await expect(options).toHaveCount(roles.length);
  for (const [index, role] of roles.entries()) {
    await expect(options.nth(index)).toHaveAccessibleName(rolesQuestionLabels[role]);
  }
};
