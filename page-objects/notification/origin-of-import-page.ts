import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import type { YesNoValue } from '@domain/constants/yes-no-values';

export class OriginOfImportPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'origin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  // The status strip carries the Draft tag and the notification reference, both
  // drawn from the first request. The reference is minted per notification, so
  // it is the one thing on this page that changes from run to run.
  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  // Country of origin is an accessible-autocomplete type-ahead enhancing a
  // native <select>. With JavaScript the enhancement takes the select's id onto
  // the enhanced input and renames the select "countryOfOrigin-select"; without
  // JavaScript the select keeps the id and is the control. So `#countryOfOrigin`
  // is whichever of the two the user actually types into.
  get countryOfOrigin(): Locator {
    return this.page.locator('#countryOfOrigin');
  }

  // The native select behind the type-ahead: hidden once enhanced, but still the
  // element that carries the country code and submits it with the form.
  get countrySelect(): Locator {
    return this.page.locator('select[name="countryOfOrigin"]');
  }

  countryOption(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  async selectCountry(name: string): Promise<void> {
    // The enhancement is a module script, so it has run by DOMContentLoaded.
    // Waiting for that settles which element the id resolves to before the probe
    // reads it. With JavaScript off the event has already fired, so this is free.
    await this.page.waitForLoadState('domcontentloaded');
    const field = this.countryOfOrigin;
    if ((await field.evaluate((el) => el.tagName)) === 'SELECT') {
      await field.selectOption({ label: name });
      return;
    }
    await field.click();
    await field.fill(name);
    await this.countryOption(name).click();
  }

  radioRequiresOriginCode(value: YesNoValue): Locator {
    return this.page.getByRole('radio', { name: value, exact: true });
  }

  get regionCode(): Locator {
    return this.page.getByLabel('Enter the region of origin code', { exact: true });
  }

  get internalReference(): Locator {
    return this.page.getByLabel('Your internal reference for this consignment (optional)');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }
}
