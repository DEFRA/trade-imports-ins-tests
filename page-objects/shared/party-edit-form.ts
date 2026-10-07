import { type Locator, type Page } from '@playwright/test';
import { type NotificationPage } from '@page-objects/shared/base-page';

/** The details of an address copied onto the notification, as the edit form names its fields. */
export type PartyEditFields = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  phone: string;
  email: string;
};

type NotificationPageClass = new (page: Page, slug: string) => NotificationPage;

/**
 * Edits the copy of an address held on one notification — never the address
 * book record it was picked from. One page per role, all with the same form.
 * Applied over each journey's notification page so animals and plants share one
 * form and differ only in the set and service they run under.
 */
export function withPartyEditForm(Base: NotificationPageClass) {
  return class PartyEditPage extends Base {
    readonly caption: string;

    constructor(page: Page, slug: string, caption: string) {
      super(page, slug);
      this.caption = caption;
    }

    get heading(): Locator {
      return this.page.getByRole('heading', { level: 1, name: 'Edit address details' });
    }

    get roleCaption(): Locator {
      return this.page.getByText(this.caption, { exact: true });
    }

    get hint(): Locator {
      return this.page.getByText('Changes apply to this notification only. Your address book is not changed.');
    }

    get name(): Locator {
      return this.page.getByLabel('Name or organisation name', { exact: true });
    }

    get addressLine1(): Locator {
      return this.page.getByLabel('Address line 1', { exact: true });
    }

    get addressLine2(): Locator {
      return this.page.getByLabel('Address line 2 (optional)', { exact: true });
    }

    get townOrCity(): Locator {
      return this.page.getByLabel('Town or city', { exact: true });
    }

    get county(): Locator {
      return this.page.getByLabel('County (optional)', { exact: true });
    }

    get postcode(): Locator {
      return this.page.getByLabel('Postcode or Zip code', { exact: true });
    }

    get country(): Locator {
      return this.page.getByLabel('Country', { exact: true });
    }

    get phone(): Locator {
      return this.page.getByLabel('Phone number', { exact: true });
    }

    get email(): Locator {
      return this.page.getByLabel('Email address', { exact: true });
    }

    get saveChanges(): Locator {
      return this.page.getByRole('button', { name: 'Save changes' });
    }

    get cancel(): Locator {
      return this.page.getByRole('button', { name: 'Cancel' });
    }

    get errorSummary(): Locator {
      return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
    }

    async fill(fields: Partial<PartyEditFields>): Promise<void> {
      for (const [key, value] of Object.entries(fields) as Array<[keyof PartyEditFields, string]>) {
        await this[key].fill(value);
      }
    }

    /**
     * Picks a country value the list does not offer, as a hand-crafted post would.
     * The select only offers listed countries, so the option is added first.
     */
    async chooseUnlistedCountry(code: string): Promise<void> {
      await this.country.evaluate((select, value) => {
        const option = document.createElement('option');
        option.value = value;
        option.text = value;
        select.appendChild(option);
      }, code);
      await this.country.selectOption(code);
    }
  };
}
