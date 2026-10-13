import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';
import type { YesNoValue } from '@domain/shared/constants/yes-no-values';

export class AnimalsOriginOfImportPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'origin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  /** The id of the template this page is open for, read from its `/templates/<id>/origin` URL. */
  templateIdFromUrl(): string {
    const match = new URL(this.page.url()).pathname.match(new RegExp(`^${SET_BASES.liveAnimals}/templates/([^/]+)/origin`));
    if (!match) {
      throw new Error(`No template id in origin URL: ${this.page.url()}`);
    }
    return match[1];
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

  // The GOV.UK hint under the country question, by the id govukSelect gives it.
  get countryHint(): Locator {
    return this.page.locator('#countryOfOrigin-hint');
  }

  // Every country offered, skipping the empty placeholder option.
  get countryOptions(): Locator {
    return this.countrySelect.locator('option:not([value=""])');
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

  get regionRequirementGroup(): Locator {
    return this.page.getByRole('group', { name: 'Does the consignment have a region of origin code?' });
  }

  get regionCode(): Locator {
    return this.page.getByLabel('Enter the region of origin code', { exact: true });
  }

  // The fixed country code shown in front of the region code box.
  get regionCodePrefix(): Locator {
    return this.page.locator('.govuk-input__prefix');
  }

  // The box caps typing at five characters; removing the cap submits a longer
  // code the way an uncapped client would, so the server's own rule is reached.
  async removeRegionCodeMaxLength(): Promise<void> {
    await this.regionCode.evaluate((input) => input.removeAttribute('maxlength'));
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

  /** The Draft tag, which only a notification's strip carries. */
  get draftTag(): Locator {
    return this.journeyStrip.getByText('Draft');
  }

  /** The reference minted for a notification (GBN-AG-yy-XXXXXX); a template has none. */
  get notificationReference(): Locator {
    return this.page.getByText(/GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}/);
  }

  get caption(): Locator {
    return this.page.getByText('About the consignment', { exact: true });
  }

  get btnSaveAndReturn(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview' });
  }

  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel' });
  }

  /** The only submit button when changing a section of a saved template. */
  get btnSaveAndReturnToTemplate(): Locator {
    return this.page.getByRole('button', { name: 'Save and return', exact: true });
  }

  /** The link back to the template's page when changing a section of a saved template. */
  get linkCancelToTemplate(): Locator {
    return this.page.getByRole('link', { name: 'Cancel', exact: true });
  }

  /** Every submit button in the page's form. */
  get submitButtons(): Locator {
    return this.page.getByRole('main').locator('form').getByRole('button');
  }

  get alert(): Locator {
    return this.page.getByRole('alert');
  }

  get errorSummaryLinks(): Locator {
    return this.page.locator('.govuk-error-summary').getByRole('link');
  }

  errorLinkNamed(message: string): Locator {
    return this.page.getByRole('link', { name: message });
  }

  get regionCodeMaxLengthErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Region of origin code must be 5 characters or less' });
  }
}
