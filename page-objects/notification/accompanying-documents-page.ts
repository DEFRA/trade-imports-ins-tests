import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class AccompanyingDocumentsPage extends NotificationPage {
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

  // The JavaScript-enhanced file upload hides the input inside a drop zone and
  // puts a button in front of it carrying the field's id, so the label now
  // names the button. The file still goes to the input behind it.
  get fileUpload(): Locator {
    return this.page.locator('input[type="file"]');
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
