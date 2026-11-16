import { expect, type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { commodityCardTitle, speciesBlockHeading, type CommodityLine } from '@domain/animals/constants/commodity-lines';
import { NotificationPage, type OpenOptions } from '@page-objects/shared/base-page';
import { ViewHeader } from '@page-objects/shared/view-header';

const SPECIES_BLOCK_SELECTOR = '[id^="species-block-"]';

export class AnimalsNotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  readonly viewHeader = new ViewHeader(this.page);

  get amendReviewHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review your notification' });
  }

  get resubmittingHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Review before re-submitting' });
  }

  get anyReviewHeading(): Locator {
    return this.viewHeader.reference.or(this.amendReviewHeading).or(this.resubmittingHeading);
  }

  async expectDraftReview(referenceNumber?: string): Promise<void> {
    if (referenceNumber) {
      await expect(this.viewHeader.reference).toHaveText(referenceNumber);
    } else {
      await expect(this.viewHeader.reference).toBeVisible();
    }
    await expect(this.viewHeader.statusTag).toHaveText('Draft');
  }

  get referenceNumberCaption(): Locator {
    return this.journeyStrip;
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get documentsSectionError(): Locator {
    return this.page
      .getByRole('heading', { level: 2, name: '4. Uploaded documents' })
      .locator('xpath=following-sibling::p[contains(@class, "govuk-error-message")][1]');
  }

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  summaryCard(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true }).locator('xpath=ancestor::*[.//dl][1]');
  }

  get whatAreYouImportingCard(): Locator {
    return this.summaryCard('What are you importing?');
  }

  commodityCard(line: CommodityLine): Locator {
    return this.summaryCard(commodityCardTitle(line));
  }

  get whatAreYouImportingSpecies(): Locator {
    return this.summaryValue(this.whatAreYouImportingCard, 'Species');
  }

  changeCommodityLink(line: CommodityLine): Locator {
    return this.changeLink(`Change commodity ${commodityCardTitle(line)}`);
  }

  get commodityCardTitles(): Locator {
    return this.page.locator(
      'xpath=//h3[preceding::h2[1][normalize-space()="2. Description of the goods"]][../following-sibling::*[.//*[starts-with(@id, "species-block-")]]]',
    );
  }

  speciesBlock(line: CommodityLine): Locator {
    return this.commodityCard(line)
      .locator(SPECIES_BLOCK_SELECTOR)
      .filter({ has: this.page.getByRole('heading', { name: speciesBlockHeading(line), exact: true }) });
  }

  speciesBlockHeadings(line: CommodityLine): Locator {
    return this.commodityCard(line).locator(SPECIES_BLOCK_SELECTOR).getByRole('heading', { level: 4 });
  }

  documentCard(position: number): Locator {
    return this.summaryCard(`Document ${position}`);
  }

  async openRefused(referenceNumber: string): Promise<void> {
    await this.navigateToService(`${this.expectedUrl(referenceNumber)}?refused=1`);
    await this.viewHeader.reference.waitFor(pageLoadWait);
  }

  summaryValue(card: Locator, key: string): Locator {
    return card
      .getByRole('term')
      .filter({ has: this.page.getByText(key, { exact: true }) })
      .locator('xpath=following-sibling::dd[1]');
  }

  summaryKeys(card: Locator): Locator {
    return card.getByRole('term');
  }

  get regionOfOriginCode(): Locator {
    return this.summaryValue(this.summaryCard('Origin of import'), 'Region of origin code');
  }

  partyRow(card: string, role: string): Locator {
    return this.summaryCard(card)
      .locator('dl > div')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(role, { exact: true })) });
  }

  cardLinks(card: string): Locator {
    return this.summaryCard(card).getByRole('link');
  }

  cardSubsection(card: string, heading: string): Locator {
    return this.summaryCard(card).locator(`xpath=.//h4[normalize-space()="${heading}"]/following-sibling::dl[1]`);
  }

  partyError(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('definition').first();
  }

  async open(referenceNumber: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await super.open(referenceNumber, { attemptSignIn, ...identity });
    if (attemptSignIn) {
      await this.anyReviewHeading.waitFor(pageLoadWait);
    }
  }

  /** Opens the view's address and signs in, without waiting for any heading: for a notification that may not exist. */
  async openWithoutWaiting(referenceNumber: string): Promise<void> {
    await super.open(referenceNumber);
  }
}
