import { type Locator, type Page } from '@playwright/test';
import { NotificationPage, requireBaseUrl } from '@page-objects/shared/base-page';
import { TypeAhead } from '@page-objects/shared/type-ahead';
import type { YesNoValue } from '@domain/shared/constants/yes-no-values';

export class AnimalsOriginOfImportPage extends NotificationPage {
  public readonly country: TypeAhead;

  constructor(page: Page) {
    super(page, 'origin');
    this.country = new TypeAhead(page, 'countryOfOrigin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  radioRequiresOriginCode(value: YesNoValue): Locator {
    return this.page.getByRole('radio', { name: value, exact: true });
  }

  get regionCode(): Locator {
    return this.page.getByLabel('Enter the region of origin code', { exact: true });
  }

  private get regionCodeConditional(): Locator {
    return this.regionCode.locator('xpath=ancestor::*[contains(@class,"govuk-radios__conditional")][1]');
  }

  get regionCodePrefix(): Locator {
    return this.regionCodeConditional.locator('.govuk-input__prefix');
  }

  get regionRequirementGroup(): Locator {
    return this.page.getByRole('group', { name: 'Does the consignment have a region of origin code?' });
  }

  async removeRegionCodeMaxlength(): Promise<void> {
    await this.regionCode.evaluate((input) => input.removeAttribute('maxlength'));
  }

  get internalReference(): Locator {
    return this.page.getByLabel('Your internal reference for this consignment (optional)');
  }

  /** Follows Back out of the animals service, then completes any sign-in the INS asks for. */
  async followBackToInsTypeQuestion(): Promise<void> {
    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    await this.leaveOriginThenSignIn(animalsOrigin, () => this.linkBack.click());
  }

  get regionCodeMaxLengthErrorLink(): Locator {
    return this.page.getByRole('link', { name: 'Region of origin code must be 5 characters or less' });
  }
}
