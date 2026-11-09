import type { InsPages } from '@page-objects';
import type { OpenOptions } from '@page-objects/shared/base-page';
import type { AddressDetails } from '@page-objects/ins/address-book/form-page';
import type { PrivateTransporterDetails } from '@page-objects/ins/address-book/private-transporter-page';
import type { CommercialTransporterDetails } from '@page-objects/ins/address-book/commercial-transporter-page';
import { addressTypes, type AddressType, type AddressRole, type AddressTypeAskingRoles } from '@domain/shared/constants/address-types';
import { rolesQuestionOptions, type AddressBookTab } from '@domain/ins/constants/address-book-types';
import { transporterTypes, type TransporterType } from '@domain/ins/constants/transporter-types';

type AddressFormOptions = OpenOptions & { addressType?: AddressTypeAskingRoles };

const defaultAddressType = addressTypes.originOrConsignor;
const defaultTransporterType = transporterTypes.private;

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

  /** Opens the address book list on a tab and, when a search term is given, searches that tab with the Search button. */
  async toAddressBookTab(tab: AddressBookTab, { search, ...openOptions }: OpenOptions & { search?: string } = {}): Promise<void> {
    await this.insPages.addressBookList.open(openOptions);
    await this.insPages.addressBookList.followTab(tab);
    await this.insPages.addressBookList.waitForTabListing(tab);
    if (search !== undefined) {
      await this.insPages.addressBookList.search(search, { submitWith: 'button' });
      await this.insPages.addressBookList.waitForTabListing(tab, { searchTerm: search });
    }
  }

  /** Chooses a type on the address type page and lands on the page it leads to: the add form for the
   * three types that group roles, or the transporter type question for Transporter. */
  async chooseAddressType(addressType: AddressType = defaultAddressType): Promise<void> {
    await this.insPages.addressBookAddressType.choose(addressType);
    await this.insPages.addressBookAddressType.continue();
    if (addressType === addressTypes.transporter) {
      await this.insPages.transporterType.heading.waitFor();
    } else {
      await this.insPages.addressBookAdd.heading.waitFor();
    }
  }

  /** Opens the add address form with a type chosen on the address type page. */
  async toAddressForm({ addressType = defaultAddressType, ...openOptions }: AddressFormOptions = {}): Promise<void> {
    await this.toAddressType(openOptions);
    await this.chooseAddressType(addressType);
  }

  /** Opens the add address form from the address book list, with a type chosen. */
  async toAddressFormFromList({ addressType = defaultAddressType, ...openOptions }: AddressFormOptions = {}): Promise<void> {
    await this.toAddressTypeFromList(openOptions);
    await this.chooseAddressType(addressType);
  }

  /** Adds an address from the address book list: chooses the type, fills the form, ticks the roles and saves, landing on the list. */
  async addAddressFromList(
    details: AddressDetails,
    {
      addressType = defaultAddressType,
      roles = rolesQuestionOptions[addressType].slice(0, 1),
      ...openOptions
    }: AddressFormOptions & { roles?: readonly AddressRole[] } = {},
  ): Promise<void> {
    await this.toAddressFormFromList({ addressType, ...openOptions });
    await this.insPages.addressBookAdd.fill(details);
    await this.insPages.addressBookAdd.tickRoles(roles);
    await this.insPages.addressBookAdd.saveAndContinue();
    await this.insPages.addressBookList.heading.waitFor();
  }

  /** Opens the transporter type question with the address type question's Transporter option chosen. */
  async toTransporterType(options: OpenOptions = {}): Promise<void> {
    await this.toAddressType(options);
    await this.chooseAddressType(addressTypes.transporter);
  }

  /** Opens the transporter type question from the address book list's 'Add a new address' button. */
  async toTransporterTypeFromList(options: OpenOptions = {}): Promise<void> {
    await this.toAddressTypeFromList(options);
    await this.chooseAddressType(addressTypes.transporter);
  }

  /** Chooses a type on the transporter type question and lands on the form it leads to. */
  async chooseTransporterType(transporterType: TransporterType = defaultTransporterType): Promise<void> {
    await this.insPages.transporterType.choose(transporterType);
    await this.insPages.transporterType.continue();
    if (transporterType === transporterTypes.commercial) {
      await this.insPages.commercialTransporter.heading.waitFor();
    } else {
      await this.insPages.privateTransporter.heading.waitFor();
    }
  }

  /** Opens the private transporter form from the address book list, with Private chosen. */
  async toPrivateTransporterFormFromList(options: OpenOptions = {}): Promise<void> {
    await this.toTransporterTypeFromList(options);
    await this.chooseTransporterType(transporterTypes.private);
  }

  /** Opens the commercial transporter form from the address book list, with Commercial chosen. */
  async toCommercialTransporterFormFromList(options: OpenOptions = {}): Promise<void> {
    await this.toTransporterTypeFromList(options);
    await this.chooseTransporterType(transporterTypes.commercial);
  }

  /** Adds a private transporter from the address book list end to end, landing on the address book
   * filtered to transporters with the success banner shown. */
  async addPrivateTransporterFromList(details: PrivateTransporterDetails, options: OpenOptions = {}): Promise<void> {
    await this.toPrivateTransporterFormFromList(options);
    await this.insPages.privateTransporter.fill(details);
    await this.insPages.privateTransporter.saveAndContinue();
    await this.insPages.addressBookList.successBanner.waitFor();
  }

  /** Adds a commercial transporter from the address book list end to end, landing on the address book
   * filtered to transporters with the success banner shown. */
  async addCommercialTransporterFromList(details: CommercialTransporterDetails, options: OpenOptions = {}): Promise<void> {
    await this.toCommercialTransporterFormFromList(options);
    await this.insPages.commercialTransporter.fill(details);
    await this.insPages.commercialTransporter.saveAndContinue();
    await this.insPages.addressBookList.successBanner.waitFor();
  }
}
