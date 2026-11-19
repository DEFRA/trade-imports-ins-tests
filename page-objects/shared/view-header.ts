import { expect, type Locator, type Page } from '@playwright/test';
import { valueOfTerm } from '@page-objects/shared/summary-list';

export const NOTIFICATION_REFERENCE_PATTERN = 'GBN-[A-Z]+-\\d{2}-[0-9A-Z]{6}';

/** The header of a notification's view, in every status that has one: reference, statusTag, dateCreated or dateSubmitted, actions and import reference numbers. */
export class ViewHeader {
  constructor(private readonly page: Page) {}

  get reference(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 1, name: new RegExp(`^${NOTIFICATION_REFERENCE_PATTERN}$`) });
  }

  get statusTag(): Locator {
    return this.page.locator('main h1 + .govuk-tag');
  }

  get dateCreated(): Locator {
    return this.page.getByText(/^Date created: /);
  }

  get dateSubmitted(): Locator {
    return this.page.getByText(/^Date submitted: /);
  }

  get actions(): Locator {
    return this.page.getByRole('main').locator('.govuk-button-group').first().locator('> *');
  }

  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend this notification', exact: true });
  }

  get importReferences(): Locator {
    return this.page.getByRole('region', { name: 'Import reference numbers', exact: true });
  }

  get importReferencesWarning(): Locator {
    return this.importReferences.locator('.govuk-warning-text');
  }

  get notificationReferenceValue(): Locator {
    return this.importReferenceValue('Notification reference');
  }

  importReferenceValue(key: string): Locator {
    return valueOfTerm(this.importReferences, key);
  }

  async expectDraftReview(referenceNumber?: string): Promise<void> {
    if (referenceNumber) {
      await expect(this.reference).toHaveText(referenceNumber);
    } else {
      await expect(this.reference).toBeVisible();
    }
    await expect(this.statusTag).toHaveText('Draft');
  }
}

export async function expectImportReferencesAsText(
  viewHeader: ViewHeader,
  { referenceNumber, customsDocumentCode }: { referenceNumber: string; customsDocumentCode: string },
): Promise<void> {
  const importReferencesWarning =
    'You must use the correct reference and code on the customs declaration or your consignment will be delayed.';
  await expect(viewHeader.importReferencesWarning).toContainText(importReferencesWarning);
  await expect(viewHeader.notificationReferenceValue).toHaveText(referenceNumber);
  await expect(viewHeader.importReferenceValue('Customs document code')).toHaveText(customsDocumentCode);
  await expect(viewHeader.importReferences.getByRole('button')).toHaveCount(0);
}
