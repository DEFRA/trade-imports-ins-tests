import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export type PartyRole = 'Consignor' | 'Place of destination' | 'Place of origin' | 'Consignee' | 'Importer';

const CPH_SECTION_HEADING = 'County parish holding (CPH) number';

const ADD_LINK_BY_ROLE: Record<PartyRole, string> = {
  Consignor: 'Add a consignor',
  'Place of destination': 'Add a place of destination',
  'Place of origin': 'Add a place of origin',
  Consignee: 'Add a consignee',
  Importer: 'Add an importer',
};

export type AddressTextParts = {
  name: string;
  addressLine1: string;
  townOrCity: string;
  postcode: string;
  country: string;
};

export class AnimalsAddressesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'addresses');
  }

  static expectedAddressText({ name, addressLine1, townOrCity, postcode, country }: AddressTextParts): string {
    return `${name} ${addressLine1} ${townOrCity}, ${postcode}, ${country}`;
  }

  static addLinkName(role: PartyRole): string {
    return ADD_LINK_BY_ROLE[role];
  }

  static partyLinkNames(role: PartyRole): { change: string; editDetails: string } {
    const party = role.toLowerCase();
    return { change: `Change ${party}`, editDetails: `Edit details ${party}` };
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignment addresses' });
  }

  get intro(): Locator {
    return this.page.getByText('Add all the addresses that are involved in the consignment.', { exact: true });
  }

  partySection(role: PartyRole): Locator {
    return this.page.getByRole('region', { name: role, exact: true });
  }

  partyAddressLines(role: PartyRole): Locator {
    return this.partySection(role).locator('.govuk-inset-text');
  }

  partyLinks(role: PartyRole): Locator {
    return this.partySection(role).getByRole('link');
  }

  addParty(role: PartyRole): Locator {
    return this.partySection(role).getByRole('link', { name: AnimalsAddressesPage.addLinkName(role), exact: true });
  }

  changeParty(role: PartyRole): Locator {
    return this.partySection(role).getByRole('link', { name: 'Change' });
  }

  editPartyDetails(role: PartyRole): Locator {
    return this.partySection(role).getByRole('link', { name: 'Edit details' });
  }

  get cphSection(): Locator {
    return this.page.getByRole('region', { name: CPH_SECTION_HEADING, exact: true });
  }

  get cphLinks(): Locator {
    return this.cphSection.getByRole('link');
  }

  get cphLinkNames(): { change: string } {
    return { change: `Change ${CPH_SECTION_HEADING.toLowerCase()}` };
  }

  get cphNumberText(): Locator {
    return this.cphSection.locator('.govuk-inset-text');
  }

  get addCph(): Locator {
    return this.cphSection.getByRole('link', { name: 'Add a CPH number', exact: true });
  }

  get changeCph(): Locator {
    return this.cphSection.getByRole('link', { name: 'Change' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }
}
