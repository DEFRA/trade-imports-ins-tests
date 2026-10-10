import { type Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

export class AnimalsManageTemplatesPage extends BasePage {
  readonly expectedUrl = `${SET_BASES.liveAnimals}/templates`;

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Manage templates' });
  }

  get intro(): Locator {
    return this.page.getByText('Select, manage or create new notification templates');
  }

  get myTemplatesHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'My templates' });
  }

  get resultsCount(): Locator {
    return this.page.getByText(/^Show (?:0 of 0|1-\d+ of \d+) results$/);
  }

  get templateCards(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 3 });
  }

  get sortControl(): Locator {
    return this.page.getByRole('main').getByRole('combobox');
  }

  get searchControls(): Locator {
    return this.page.getByRole('main').getByRole('searchbox').or(this.page.getByRole('main').getByRole('textbox'));
  }

  get sortByText(): Locator {
    return this.page.getByRole('main').getByText('Sort by');
  }

  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: /pagination/i });
  }

  get bodyParagraphs(): Locator {
    return this.page.getByRole('main').locator('p.govuk-body');
  }

  get phaseBannerFeedbackLink(): Locator {
    return this.page.getByRole('link', { name: 'give your feedback by email' });
  }

  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.navigateToFrontend(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, options);

    if (attemptSignIn) {
      await this.heading.waitFor({ state: 'visible' });
    }
  }
}
