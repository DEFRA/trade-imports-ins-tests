import { type Locator, type Page } from '@playwright/test';
import { type SpeciesNamePair } from '@domain/animals/constants/commodity-lines';
import { type NewPermanentAddressFields } from '@domain/animals/constants/journey-commodity-line-answers';
import { NotificationPage } from '@page-objects/shared/base-page';

const PLACE_OF_DESTINATION_OPTION = 'Same as the place of destination (POD)';
const NEW_ADDRESS_OPTION = 'Enter a new address';

export class AnimalsPermanentAddressPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'permanent-address');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Permanent address' });
  }

  card(species: SpeciesNamePair, number: number): Locator {
    return this.page.getByRole('region', { name: `${species.latinName} ${number}`, exact: true });
  }

  cardsFor(species: SpeciesNamePair): Locator {
    return this.page.getByRole('region', { name: new RegExp(`^${species.latinName} \\d+$`) });
  }

  selectPlaceOfDestination(card: Locator): Promise<void> {
    return card.getByRole('radio', { name: PLACE_OF_DESTINATION_OPTION }).check();
  }

  selectNewAddress(card: Locator): Promise<void> {
    return card.getByRole('radio', { name: NEW_ADDRESS_OPTION }).check();
  }

  async fillNewAddress(address: NewPermanentAddressFields, card: Locator): Promise<void> {
    const field = (label: string): Locator => card.getByLabel(label, { exact: true });
    await field('Name or organisation name').fill(address.nameOrOrganisationName);
    await field('Address line 1').fill(address.addressLine1);
    if (address.addressLine2) {
      await field('Address line 2 (optional)').fill(address.addressLine2);
    }
    await field('Town or city').fill(address.townOrCity);
    if (address.county) {
      await field('County (optional)').fill(address.county);
    }
    await field('Postcode or Zip code').fill(address.postcode);
    await field('Email address').fill(address.email);
    await field('Phone number').fill(address.phone);
  }
}
