import type { InsPages } from '@page-objects';
import type { OpenOptions } from '@page-objects/shared/base-page';
import type { AddressDetails } from '@page-objects/ins/address-book/form-page';
import { addressTypes, addressUses, type AddressType, type AddressUse } from '@domain/shared/constants/address-types';

type AddressFormOptions = OpenOptions & { addressType?: AddressType };

export class InsJourney {
  constructor(private readonly insPages: InsPages) {}

  /** Opens the address type page directly and waits for it. */
  async toAddressType(options: OpenOptions = {}): Promise<void> {
    await this.insPages.addressBookAddressType.open(options);
    await this.insPages.addressBookAddressType.heading.waitFor();
  }

  /** Opens the address type page through the address book list's 'Add a new address' button. */
  async toAddressTypeFromList(options: OpenOptions = {}): Promise<void> {
    await this.insPages.addressBookList.open(options);
    await this.insPages.addressBookList.btnAddNewAddress.click();
    await this.insPages.addressBookAddressType.heading.waitFor();
  }

  /** Chooses a type on the address type page and lands on the add address form. */
  async chooseAddressType(addressType: AddressType = addressTypes.originOrConsignor): Promise<void> {
    await this.insPages.addressBookAddressType.choose(addressType);
    await this.insPages.addressBookAddressType.continue();
    await this.insPages.addressBookAdd.heading.waitFor();
  }

  /** Opens the add address form with a type chosen on the address type page. */
  async toAddressForm({ addressType = addressTypes.originOrConsignor, ...openOptions }: AddressFormOptions = {}): Promise<void> {
    await this.toAddressType(openOptions);
    await this.chooseAddressType(addressType);
  }

  /** Opens the add address form from the address book list, with a type chosen. */
  async toAddressFormFromList({ addressType = addressTypes.originOrConsignor, ...openOptions }: AddressFormOptions = {}): Promise<void> {
    await this.toAddressTypeFromList(openOptions);
    await this.chooseAddressType(addressType);
  }

  /** Adds an address from the address book list: chooses the type, fills the form, ticks the uses and saves, landing on the list. */
  async addAddressFromList(
    details: AddressDetails,
    { uses = [addressUses.placeOfOrigin], ...formOptions }: AddressFormOptions & { uses?: readonly AddressUse[] } = {},
  ): Promise<void> {
    await this.toAddressFormFromList(formOptions);
    await this.insPages.addressBookAdd.fill(details);
    await this.insPages.addressBookAdd.tickUses(uses);
    await this.insPages.addressBookAdd.saveAndContinue();
    await this.insPages.addressBookList.heading.waitFor();
  }
}
