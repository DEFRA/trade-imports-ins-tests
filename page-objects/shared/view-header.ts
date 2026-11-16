import type { Locator, Page } from '@playwright/test';

/** The header of a notification's view, in every status that has one: reference, statusTag, dateCreated or dateSubmitted, actions and import reference numbers. */
export class ViewHeader {
  constructor(private readonly page: Page) {}

  get reference(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 1, name: /^GBN-[A-Z]+-\d{2}-[0-9A-Z]{6}$/ });
  }

  get statusTag(): Locator {
    return this.page.locator('main h1 + .govuk-tag');
  }

  get dateCreated(): Locator {
    return this.page.getByText(/^Date created: /);
  }

  get dateSubmitted(): Locator {
    return this.page.getByText(/^Date submitted: /);
  }

  get actions(): Locator {
    return this.page.getByRole('main').locator('.govuk-button-group').first().locator('> *');
  }

  get actionRequiredWarning(): Locator {
    return this.page.getByRole('main').locator('.govuk-warning-text', { hasText: 'You need to upload a health certificate' });
  }

  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend this notification', exact: true });
  }

  get importReferences(): Locator {
    return this.page.getByRole('region', { name: 'Import reference numbers', exact: true });
  }

  get importReferencesWarning(): Locator {
    return this.importReferences.locator('.govuk-warning-text');
  }

  get notificationReferenceValue(): Locator {
    return this.importReferenceValue('Notification reference');
  }

  importReferenceValue(key: string): Locator {
    return this.importReferences
      .getByRole('term')
      .filter({ has: this.page.getByText(key, { exact: true }) })
      .locator('xpath=following-sibling::dd[1]');
  }
}
