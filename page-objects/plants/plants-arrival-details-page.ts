import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * When the consignment arrives, and for potatoes what time and where it lands.
 *
 * Every commodity type is asked this page, so it is the arrival section's last
 * step for all of them. The date question means three different things — the
 * expected date of arrival for potatoes, the expected date of landing before
 * arrival, the date it first arrived after — and the label is the only thing
 * that says which, so it is addressed rather than assumed. The time and the
 * place of landing are potato matters and are not rendered for anything else.
 */
export class PlantsArrivalDetailsPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'arrival-details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  /** The MoJ date picker is one text box taking `d/m/yyyy`, not three date parts. */
  get arrivalDate(): Locator {
    return this.page.locator('#arrivalDate');
  }

  /**
   * The date question addressed by the sentence it is asked under. The label is
   * the input's accessible name, so naming it both finds the field and proves
   * which of the three states the page put it in.
   */
  dateQuestionLabelled(label: string): Locator {
    return this.page.getByRole('textbox', { name: label, exact: true });
  }

  get arrivalTime(): Locator {
    return this.page.locator('#arrivalTime');
  }

  /**
   * Proposed place of landing is an accessible-autocomplete type-ahead
   * enhancing a native <select>, the same enhancement the origin page uses: the
   * enhanced input takes the select's id, so `#proposedPlaceOfLanding` is
   * whichever of the two the trader actually types into.
   */
  get proposedPlaceOfLanding(): Locator {
    return this.page.locator('#proposedPlaceOfLanding');
  }

  placeOfLandingOption(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true });
  }

  /** Ports are offered as "{name} ({code})", the one label both sides share. */
  async selectPlaceOfLanding(name: string): Promise<void> {
    // The enhancement is a module script, so it has run by DOMContentLoaded.
    // Waiting for that settles which element the id resolves to before the
    // probe reads it. With JavaScript off the event has already fired.
    await this.page.waitForLoadState('domcontentloaded');
    const field = this.proposedPlaceOfLanding;
    if ((await field.evaluate((el) => el.tagName)) === 'SELECT') {
      await field.selectOption({ label: name });
      return;
    }
    await field.click();
    await field.fill(name);
    await this.placeOfLandingOption(name).click();
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
