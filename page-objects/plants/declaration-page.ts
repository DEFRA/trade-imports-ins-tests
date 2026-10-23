import type { Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/notification-page';
import { DeclarationContent } from '@page-objects/shared/declaration-content';

export class PlantsDeclarationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'declaration');
  }

  get content(): DeclarationContent {
    return new DeclarationContent(this.page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Declaration', level: 1 });
  }
  get checkbox(): Locator {
    return this.page.getByRole('checkbox', {
      name: 'I confirm that I have reviewed and comply with this declaration and that the information submitted in this notification is true and correct.',
      exact: true,
    });
  }
  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue', exact: true });
  }
  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }
}
