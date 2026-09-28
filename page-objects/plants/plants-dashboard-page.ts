import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantsDashboardPage extends BasePage {
  readonly expectedUrl = SET_BASES.highRiskPlants;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnStartNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Start a new notification' });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  get inputReferenceSearch(): Locator {
    return this.page.getByLabel('Keyword or reference');
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  /**
   * Server-side dashboard search via GET ?referenceNumber=, an exact match on a
   * complete reference. The listing is paginated over every notification the
   * backend holds, not just this session's, so a spec that wants to see its own
   * card narrows the listing to it first rather than hunting the pages.
   */
  async searchForReference(referenceNumber: string): Promise<void> {
    await this.inputReferenceSearch.fill(referenceNumber);
    await Promise.all([
      this.page.waitForURL((url) => (url.searchParams.get('referenceNumber') ?? '') === referenceNumber),
      this.btnSearch.click(),
    ]);
  }

  get notificationCards(): Locator {
    return this.page.locator('.govuk-summary-card');
  }

  notificationCard(reference: string): Locator {
    return this.notificationCards.filter({ hasText: reference });
  }

  statusTag(reference: string): Locator {
    return this.notificationCard(reference)
      .locator('dt')
      .filter({ hasText: 'Status' })
      .locator('xpath=following-sibling::dd[1]')
      .locator('.govuk-tag');
  }

  /**
   * The card's action links come from govukSummaryList's own card macro, which appends
   * the card title in brackets as visually hidden text — so the accessible name is
   * "Resume (25-ABC123)", not the animals dashboard's "Resume notification 25-ABC123".
   * That dashboard hand-rolls its summary card; this one stays in the govuk toolbox.
   */
  private cardAction(reference: string, text: string): Locator {
    return this.notificationCard(reference).getByRole('link', { name: `${text} (${reference})`, exact: true });
  }

  resume(reference: string): Locator {
    return this.cardAction(reference, 'Resume');
  }

  delete(reference: string): Locator {
    return this.cardAction(reference, 'Delete');
  }

  get deletedBanner(): Locator {
    return this.page.locator('.govuk-notification-banner');
  }

  get emptyState(): Locator {
    return this.page.getByText('You have not started any notifications in this session.');
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToPlantsFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }
}
