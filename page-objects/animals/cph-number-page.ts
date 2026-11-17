import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';

type CphNumberParts = { county?: string; parish?: string; holding?: string };

export class AnimalsCphNumberPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'cph-number');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add the county parish holding number (CPH)' });
  }

  get county(): Locator {
    return this.page.getByLabel('County', { exact: true });
  }

  get parish(): Locator {
    return this.page.getByLabel('Parish', { exact: true });
  }

  get holding(): Locator {
    return this.page.getByLabel('Holding number', { exact: true });
  }

  get helpSummary(): Locator {
    return this.page.getByText('What is a CPH number?', { exact: true });
  }

  get helpWhereToFind(): Locator {
    return this.page.getByText('You can find your CPH number on documents from the Animal and Plant Health Agency (APHA) or by', {
      exact: false,
    });
  }

  get holdingDetailsLink(): Locator {
    return this.page.getByRole('link', { name: 'checking your holding details on GOV.UK', exact: true });
  }

  get hint(): Locator {
    return this.page.getByText('For example 12/345/6789', { exact: true });
  }

  async fillCphNumber({ county = '12', parish = '345', holding = '6789' }: CphNumberParts = {}): Promise<void> {
    await this.county.fill(county);
    await this.parish.fill(parish);
    await this.holding.fill(holding);
  }
}
