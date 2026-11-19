import { CONSIGNMENT_ADDRESSES } from '@domain/animals/constants/consignment-addresses-page';
import { type Locator, type Page } from '@playwright/test';
import { pageLoadWait } from '@config/timeouts';
import { commodityCardTitle, speciesBlockHeading, type CommodityLine } from '@domain/animals/constants/commodity-lines';
import { NotificationPage, type OpenOptions } from '@page-objects/shared/base-page';
import { ViewHeader } from '@page-objects/shared/view-header';
import { valueOfTerm } from '@page-objects/shared/summary-list';

const SPECIES_BLOCK_SELECTOR = '[id^="species-block-"]';

export const reviewHeadingText = 'Review your notification';
export const resubmitHeadingText = 'Review before re-submitting';

export class AnimalsNotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  readonly viewHeader = new ViewHeader(this.page);

  get heading(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 1 });
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

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  summaryCard(name: string): Locator {
    return this.page.locator('.govuk-summary-card').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  get whatAreYouImportingCard(): Locator {
    return this.summaryCard('What are you importing?');
  }

  get addressesCard(): Locator {
    return this.summaryCard(CONSIGNMENT_ADDRESSES);
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
    return this.page
      .locator('.govuk-summary-card')
      .filter({ has: this.page.locator(SPECIES_BLOCK_SELECTOR) })
      .locator('.govuk-summary-card__title');
  }

  speciesBlock(line: CommodityLine): Locator {
    return this.commodityCard(line)
      .locator(SPECIES_BLOCK_SELECTOR)
      .filter({ has: this.page.getByRole('heading', { name: speciesBlockHeading(line), exact: true }) });
  }

  speciesBlockHeadingsInCommodityCardOf(line: CommodityLine): Locator {
    return this.commodityCard(line).locator(SPECIES_BLOCK_SELECTOR).getByRole('heading', { level: 4 });
  }

  documentCard(position: number): Locator {
    return this.summaryCard(`Document ${position}`);
  }

  async openRefused(referenceNumber: string): Promise<void> {
    await this.navigateToService(`${this.expectedUrl(referenceNumber)}?refused=1`);
    await this.heading.waitFor(pageLoadWait);
  }

  summaryValue(card: Locator, key: string): Locator {
    return valueOfTerm(card, key);
  }

  summaryKeys(card: Locator): Locator {
    return card.getByRole('term');
  }

  get regionOfOriginCode(): Locator {
    return this.summaryValue(this.summaryCard('Origin of import'), 'Region of origin code');
  }

  partyRow(card: string, role: string): Locator {
    return this.summaryCard(card)
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.getByRole('term').and(this.page.getByText(role, { exact: true })) });
  }

  editPartyDetails(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('link', { name: 'Edit details' });
  }

  cardLinks(card: string): Locator {
    return this.summaryCard(card).getByRole('link');
  }

  cardSubsection(card: string, heading: string): Locator {
    return this.summaryCard(card).locator(`h4:text-is("${heading}") + dl`);
  }

  partyError(card: string, role: string): Locator {
    return this.partyRow(card, role).getByRole('definition').first();
  }

  async open(referenceNumber: string, { attemptSignIn = true, ...identity }: OpenOptions = {}): Promise<void> {
    await super.open(referenceNumber, { attemptSignIn, ...identity });
    if (attemptSignIn) {
      await this.heading.waitFor(pageLoadWait);
    }
  }

  async openWithoutWaiting(referenceNumber: string): Promise<void> {
    await super.open(referenceNumber);
  }
}
