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

  /** A link styled as a button, so it carries the button role. */
  get btnCreateNewTemplate(): Locator {
    return this.page.getByRole('button', { name: 'Create new template', exact: true });
  }

  get myTemplatesHeading(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'My templates' });
  }

  get resultsCount(): Locator {
    return this.page.getByText(/^Show (?:0 of 0|1-\d+ of \d+) results$/);
  }

  /** Each template is a region named 'Template <title>', so the success banner's own H3 is not counted. */
  get templateCards(): Locator {
    return this.page.getByRole('main').getByRole('region', { name: /^Template / });
  }

  templateCard(title: string): Locator {
    return this.page.getByRole('region', { name: `Template ${title}`, exact: true });
  }

  get templateTitles(): Locator {
    return this.templateCards.getByRole('heading', { level: 3 });
  }

  cardCategory(title: string): Locator {
    return this.templateCard(title).locator('.govuk-caption-m');
  }

  linkViewTemplate(title: string): Locator {
    return this.templateCard(title).getByRole('link', { name: 'View template', exact: true });
  }

  btnUseTemplate(title: string): Locator {
    return this.templateCard(title).getByRole('button', { name: 'Use template', exact: true });
  }

  useTemplateForm(title: string): Locator {
    return this.templateCard(title).locator('form');
  }

  get firstCardViewLink(): Locator {
    return this.templateCards.first().getByRole('link', { name: 'View template', exact: true });
  }

  get successBanner(): Locator {
    return this.page.locator('.govuk-notification-banner--success');
  }

  get successBannerTitle(): Locator {
    return this.successBanner.locator('.govuk-notification-banner__title');
  }

  get successBannerHeading(): Locator {
    return this.successBanner.getByRole('heading', { level: 3 });
  }

  /** The number of templates the results line counts: the last number in 'Show 1-3 of 3 results'. */
  async totalResults(): Promise<number> {
    const text = (await this.resultsCount.textContent()) ?? '';
    const numbers = text.match(/\d+/g);
    if (!numbers) {
      throw new Error(`No count in the results line: ${text}`);
    }
    return Number(numbers[numbers.length - 1]);
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
