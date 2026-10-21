import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import { DatePicker } from '@page-objects/shared/date-picker';

export class AnimalsAccompanyingDocumentsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'accompanying-documents');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Upload documents' });
  }

  get documentReference(): Locator {
    return this.page.getByLabel('Document reference');
  }

  get documentType(): Locator {
    return this.page.getByLabel('Document type');
  }

  get fileUpload(): Locator {
    return this.page.locator('input[type="file"]');
  }

  get dateOfIssuePicker(): DatePicker {
    return new DatePicker(this.page, 'accompanyingDocumentDateOfIssue');
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  documentRow(reference: string): Locator {
    return this.page.locator('.govuk-table__row', { hasText: reference });
  }

  removeDocument(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove document ${index}`, exact: true });
  }

  viewFile(index: number): Locator {
    return this.page.getByRole('link', { name: `View file for document ${index}` });
  }

  get refreshStatus(): Locator {
    return this.page.getByRole('link', { name: /Refresh/ });
  }

  async fillDocument(reference: string, issueDate: string, filePath: string, documentType: string = 'ITAHC'): Promise<void> {
    await this.documentReference.fill(reference);
    await this.documentType.selectOption(documentType);
    await this.page.locator('input[name="accompanyingDocumentDateOfIssue"]').fill(issueDate);
    await this.fileUpload.setInputFiles(filePath);
  }
}
