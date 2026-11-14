import type { Locator, Page } from '@playwright/test';

/** The header of a submitted notification's view: reference, status tag, date, actions and import reference numbers. */
export class SubmittedHeader {
  constructor(private readonly page: Page) {}

  get reference(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get dateSubmitted(): Locator {
    return this.page.getByText(/^Date submitted: /);
  }

  get actions(): Locator {
    return this.page.getByRole('main').locator('.govuk-button-group').first().locator('> *');
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

  importReferenceValue(key: string): Locator {
    return this.importReferences
      .getByRole('term')
      .filter({ has: this.page.getByText(key, { exact: true }) })
      .locator('xpath=following-sibling::dd[1]');
  }
}
