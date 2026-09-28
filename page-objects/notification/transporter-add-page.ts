import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

/** The type question — asked only of a trader who could not find their
 * transporter on the list, as the first step of adding one. */
export class TransporterAddPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transporters/add');
  }

  /** The page is headed with the choice it asks for; the question itself is a
   * visually hidden legend, so the heading is what carries the h1. */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Choose a transporter type' });
  }

  /** The rendered radio label for each type — 'Private' reads as
   * 'Private transporter' on the page, so the key is mapped rather than used
   * as the accessible name. */
  private static readonly TYPE_LABELS = {
    Commercial: 'Commercial',
    Private: 'Private transporter',
  } as const;

  transporterType(name: 'Commercial' | 'Private'): Locator {
    return this.page.getByRole('radio', {
      name: TransporterAddPage.TYPE_LABELS[name],
      exact: true,
    });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
