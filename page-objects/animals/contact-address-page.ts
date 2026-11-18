import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/shared/base-page';
import {
  PICKER_RESULTS_HEADING,
  paragraphFollowing,
  pickerResultsGroup,
  pickerResultsHeading,
} from '@page-objects/shared/address-picker-results';

const PAGE_HEADING = 'Contact address for consignment';

export class AnimalsContactAddressPage extends NotificationPage {
  static readonly headings = [PAGE_HEADING, PICKER_RESULTS_HEADING];

  constructor(page: Page) {
    super(page, 'consignment/contact/select');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: PAGE_HEADING });
  }

  get intro(): Locator {
    return paragraphFollowing(this.heading);
  }

  get resultsHeading(): Locator {
    return pickerResultsHeading(this.page);
  }

  get resultsGroup(): Locator {
    return pickerResultsGroup(this.page);
  }

  address(name: string): Locator {
    return this.page.getByRole('radio', { name });
  }

  /** Any option in the list shown as chosen. */
  get chosenAddress(): Locator {
    return this.page.getByRole('radio', { checked: true });
  }
}
