import type { Locator, Page } from '@playwright/test';

const CONFIRMATION_LEGEND = 'Declaration confirmation';

export class DeclarationContent {
  constructor(private readonly page: Page) {}

  get confirmationGroup(): Locator {
    return this.page.getByRole('group', { name: CONFIRMATION_LEGEND, exact: true });
  }

  get confirmationLegend(): Locator {
    return this.confirmationGroup.locator('legend');
  }

  get checkboxes(): Locator {
    return this.confirmationGroup.locator('.govuk-checkboxes');
  }

  get dateValue(): Locator {
    return this.page.locator('p.govuk-body', { hasText: 'Date of declaration:' }).locator('strong');
  }

  get firstContentElement(): Locator {
    return this.page.locator('main .govuk-grid-column-two-thirds > :first-child');
  }
}
