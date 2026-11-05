import { test, expect } from '@fixtures';
import { heldAsConsignor } from '@domain/shared/constants/address-types';
import { ensureE2eAddressBook, placeOfOriginFixture } from '@flows/shared/address-book-seed';

test.describe('Address book fixture reconcile', () => {
  test("a fixture record holding a different role is rewritten with the fixture's roles once, and a second run leaves it untouched", async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    await isolatedOrganisationAddressBookApi.createAddress({ ...placeOfOriginFixture, ...heldAsConsignor });

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterFirstRun = await isolatedOrganisationAddressBookApi.findByName(placeOfOriginFixture.name);
    expect(afterFirstRun.roles).toEqual(placeOfOriginFixture.roles);

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterSecondRun = await isolatedOrganisationAddressBookApi.findByName(placeOfOriginFixture.name);
    expect(afterSecondRun.modifiedAt).toBe(afterFirstRun.modifiedAt);
  });
});
