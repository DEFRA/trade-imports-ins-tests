import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * Where the consignment comes from — one notification-level answer for
 * potatoes, plants and wood alike.
 *
 * The whole SPS origin block is on offer, but which of those countries this
 * consignment may name is narrowed by the categories of the commodity lines it
 * already holds. The narrowing is enforced at Continue, so the page's refusals
 * are only reachable by going through the commodity section first.
 */
export class PlantsOriginPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'origin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  /**
   * Country of origin is an accessible-autocomplete type-ahead enhancing a
   * native <select>. With JavaScript the enhancement takes the select's id onto
   * the enhanced input; without it the select keeps the id and is the control.
   * So `#countryOfOrigin` is whichever of the two the trader actually uses.
   */
  get countryOfOrigin(): Locator {
    return this.page.locator('#countryOfOrigin');
  }

  /**
   * The native select behind the type-ahead: hidden once enhanced, but still
   * the element that carries the country code and submits it with the form.
   */
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

  /**
   * The scope guidance insets. Only a constraint that carries guidance copy
   * renders one, and today that is ware potatoes alone — so an empty count is
   * not a proof that the consignment is unnarrowed.
   */
  get guidance(): Locator {
    return this.page.locator('.govuk-inset-text');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get btnSaveAndReturnToOverview(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview', exact: true });
  }

  /** A plain link, not a govukButton, so it is addressed by the link role. */
  get linkCancel(): Locator {
    return this.page.getByRole('link', { name: 'Cancel and return to overview', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}
