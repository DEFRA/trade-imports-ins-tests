import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * One commodity line, added or edited.
 *
 * The page asks in two steps: the category alone, then — once the line exists
 * and the model has scoped it — the fields that category asks for. Which is why
 * the primary control is "Continue" before a category is chosen and "Save and
 * continue" after it.
 */
export class PlantsCommodityDetailsPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'commodities/details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity details' });
  }

  get categoryGroup(): Locator {
    return this.page.getByRole('group', { name: 'What category of goods is this?' });
  }

  category(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  /** Every category on offer, however it is labelled — the count is the assertion. */
  get categoryRadios(): Locator {
    return this.page.locator('input[name="category"]');
  }

  /** A per-line field, addressed by the label the trader reads. */
  field(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }

  get btnSaveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  /** The page as it is reached to edit a saved line, which it names by index. */
  editUrl(journeyId: string, index: number): string {
    return `${this.expectedUrl(journeyId)}?index=${index}`;
  }

  /**
   * Genus is an accessible-autocomplete type-ahead enhancing a native <select>.
   * With JavaScript the enhancement takes the select's id onto the enhanced
   * input; without it the select keeps the id and is the control. So `#genus`
   * is whichever of the two the trader actually uses.
   */
  get genus(): Locator {
    return this.page.locator('#genus');
  }

  async selectGenus(label: string): Promise<void> {
    // The enhancement is a module script, so it has run by DOMContentLoaded.
    // Waiting for that settles which element the id resolves to before the probe
    // reads it. With JavaScript off the event has already fired, so this is free.
    await this.page.waitForLoadState('domcontentloaded');
    const field = this.genus;
    if ((await field.evaluate((el) => el.tagName)) === 'SELECT') {
      await field.selectOption({ label });
      return;
    }
    await field.click();
    await field.fill(label);
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }
}
