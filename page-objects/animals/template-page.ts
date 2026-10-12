import { type Locator } from '@playwright/test';
import { BasePage } from '@page-objects/shared/base-page';

/** A saved template's own page, opened from 'View template' on Manage templates. */
export class AnimalsTemplatePage extends BasePage {
  heading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name, exact: true });
  }

  get caption(): Locator {
    return this.page.getByRole('main').getByText('Templates', { exact: true });
  }

  get dateCreated(): Locator {
    return this.page.getByText(/^Date created: /);
  }

  get btnUseTemplate(): Locator {
    return this.page.getByRole('main').getByRole('button', { name: 'Use template', exact: true });
  }

  get useTemplateForm(): Locator {
    return this.page
      .getByRole('main')
      .locator('form')
      .filter({ has: this.page.getByRole('button', { name: 'Use template', exact: true }) });
  }

  /** A link styled as a button, so it carries the button role. */
  get btnDelete(): Locator {
    return this.page.getByRole('main').getByRole('button', { name: 'Delete', exact: true });
  }

  get linksEdit(): Locator {
    return this.page.getByRole('main').getByRole('link', { name: 'Edit', exact: true });
  }

  get buttonsEdit(): Locator {
    return this.page.getByRole('main').getByRole('button', { name: 'Edit', exact: true });
  }

  /** The success banner confirming a change, shown once after Save and return. */
  get successBanner(): Locator {
    return this.page.getByRole('main').locator('.govuk-notification-banner--success');
  }

  get successBannerTitle(): Locator {
    return this.successBanner.getByText('Success', { exact: true });
  }

  successBannerHeading(text: string): Locator {
    return this.successBanner.getByRole('heading', { name: text, exact: true });
  }

  get sectionHeadings(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 2 });
  }

  /** The card's one Change link, named the way a screen reader reads it: 'Change import details (Import details)'. */
  changeLink(hiddenText: string): Locator {
    return this.page.getByRole('link', { name: `Change ${hiddenText}` });
  }

  /** The value of the row whose term is exactly `key`, in the card titled `card`. */
  rowValue(card: string, key: string): Locator {
    return this.page
      .locator('.govuk-summary-card', { has: this.page.locator('.govuk-summary-card__title', { hasText: card }) })
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(key, { exact: true })) })
      .getByRole('definition')
      .first();
  }
}
