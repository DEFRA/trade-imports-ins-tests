import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { AMEND_REFUSED_MESSAGE } from '@page-objects/shared/dashboard-copy';
import { SET_BASES } from '@page-objects/shared/sets';

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

  cardStatusTag(reference: string): Locator {
    return this.notificationCard(reference)
      .locator('dt')
      .filter({ hasText: 'Status' })
      .locator('xpath=following-sibling::dd[1]')
      .locator('.govuk-tag');
  }

  private cardAction(reference: string, text: string): Locator {
    return this.notificationCard(reference).getByRole('link', { name: `${text} (${reference})`, exact: true });
  }

  view(reference: string): Locator {
    return this.cardAction(reference, 'View');
  }

  resume(reference: string): Locator {
    return this.cardAction(reference, 'Resume');
  }

  delete(reference: string): Locator {
    return this.cardAction(reference, 'Delete');
  }

  amend(reference: string): Locator {
    return this.notificationCard(reference).getByRole('button', { name: `Amend notification ${reference}`, exact: true });
  }

  get deletedBanner(): Locator {
    return this.page.getByRole('alert', { name: 'Notification deleted' });
  }

  readonly amendRefusedMessage = AMEND_REFUSED_MESSAGE;

  get amendRefusedBanner(): Locator {
    return this.page.getByRole('region', { name: 'Important' });
  }

  get emptyState(): Locator {
    return this.page.getByText('You have not started any notifications in this session.');
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToPlantsFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn);
  }
}
