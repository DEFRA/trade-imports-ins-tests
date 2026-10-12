import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

export class AnimalsContactAddressPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'consignment/contact/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact address for consignment' });
  }

  address(name: string): Locator {
    return this.page.getByRole('radio', { name });
  }

  /** Any option in the list shown as chosen. */
  get chosenAddress(): Locator {
    return this.page.getByRole('radio', { checked: true });
  }

  /** The contact already copied onto this notification, shown apart from the list. */
  get currentContact(): Locator {
    return this.page.getByRole('region', { name: 'Current contact address' });
  }

  get editCurrentContact(): Locator {
    return this.currentContact.getByRole('link', { name: 'Edit details' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  get btnSaveAndReturn(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview' });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }

  /** Exists only to pin its absence while a template is being created. */
  get btnSaveAndReturnBare(): Locator {
    return this.page.getByRole('button', { name: 'Save and return', exact: true });
  }

  /** Exists only to pin its absence while a template is being created. */
  get linkCancelBare(): Locator {
    return this.page.getByRole('link', { name: 'Cancel', exact: true });
  }
}
