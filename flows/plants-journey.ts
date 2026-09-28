import type { PageObjects } from '@page-objects';
import type { JourneyContext } from '@flows/journey';

/**
 * One commodity line's answers, keyed by the label the trader reads. Which
 * labels a line carries is decided by its category, so the shape is open: a
 * caller writes exactly the fields that category asks for, and a missing or
 * surplus one shows up as the page rejecting the line.
 */
export type CommodityLine = Record<string, string>;

/** The one field on a line that is a type-ahead rather than a text input. */
const GENUS = 'Genus';

export class PlantsJourney {
  constructor(
    private readonly pages: PageObjects,
    private readonly context: JourneyContext,
  ) {}

  async toDashboard(): Promise<void> {
    await this.pages.plantsDashboard.open();
    await this.pages.plantsDashboard.heading.waitFor();
  }

  /**
   * Creates a notification and lands on commodity-type, the opening run's first
   * step: the create POST begins the run and redirects there, not to the
   * Overview. The POST mints the reference, so the journey id in the landing URL
   * is the reference number — the records adapter marshals `referenceNumber`
   * straight onto `journeyId`.
   */
  async startNotification(): Promise<string> {
    await this.toDashboard();
    await this.pages.plantsDashboard.btnStartNewNotification.click();
    await this.pages.plantsCommodityType.heading.waitFor();
    const journeyId = this.pages.plantsCommodityType.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }

  /**
   * Leaves the entry page for the Overview by its Cancel control, which saves
   * nothing — so a spec that wants the hub reaches it with the notification
   * exactly as the create POST left it.
   */
  async toOverview(): Promise<void> {
    await this.pages.plantsCommodityType.linkCancel.click();
    await this.pages.plantsOverview.heading.waitFor();
  }

  /**
   * Answers the entry question. Continue leaves for the commodities list, and a
   * list with no lines sends the trader straight on to the entry sub-page — so
   * this lands on the commodity-details page, not on the list.
   */
  async chooseCommodityType(label: string): Promise<void> {
    await this.pages.plantsCommodityType.commodityType(label).check();
    await this.pages.plantsCommodityType.btnSaveAndContinue.click();
    await this.pages.plantsCommodityDetails.heading.waitFor();
  }

  /**
   * Re-answers the entry question on a notification that is already under way.
   * A change that no saved line survives lands on the list rather than the
   * entry page, because the trader has to see what went.
   */
  async changeCommodityType(reference: string, label: string): Promise<void> {
    await this.pages.plantsCommodityType.open(reference);
    await this.pages.plantsCommodityType.commodityType(label).check();
    await this.pages.plantsCommodityType.btnSaveAndContinue.click();
  }

  /**
   * Adds one line from the entry page, which is where the commodity type left
   * the trader. Choosing the category creates the line and brings back the
   * fields that category asks for, so the two steps cannot be collapsed.
   */
  async addCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.pages.plantsCommodityDetails.category(category).check();
    await this.pages.plantsCommodityDetails.btnContinue.click();
    await this.pages.plantsCommodityDetails.btnSaveAndContinue.waitFor();
    await this.fillCommodityLine(values);
    await this.pages.plantsCommodityDetails.btnSaveAndContinue.click();
    await this.pages.plantsCommodities.heading.waitFor();
  }

  /** Adds a further line from the list page the last one returned to. */
  async addAnotherCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.pages.plantsCommodities.btnAddAnother.click();
    await this.pages.plantsCommodityDetails.heading.waitFor();
    await this.addCommodityLine(category, values);
  }

  /**
   * Leaves the commodities list for origin, which the list's Continue reaches
   * only while the opening run is still open. Once the run has ended,
   * commodities is the last page of its section and Continue returns to the
   * Overview instead — so a notification past its opening run reaches origin
   * with `pages.plantsOrigin.open(reference)`, not with this helper.
   */
  async toOrigin(): Promise<void> {
    await this.pages.plantsCommodities.btnSaveAndContinue.click();
    await this.pages.plantsOrigin.heading.waitFor();
  }

  /**
   * Names the country and carries on to the arrival-status question, which only
   * plants for planting and wood and cut trees are asked. A potato
   * notification's Continue passes the question over and lands on the arrival
   * details instead, so it reaches the section through `toArrivalDetails`.
   */
  async toArrivalStatus(country: string): Promise<void> {
    await this.pages.plantsOrigin.selectCountry(country);
    await this.pages.plantsOrigin.btnSaveAndContinue.click();
    await this.pages.plantsArrivalStatus.heading.waitFor();
  }

  /**
   * Names the country and carries a potato notification straight on to the
   * arrival details. `arrivalStatus` is out of scope for potatoes, so the
   * opening run skips that step rather than stopping at it.
   */
  async toArrivalDetails(country: string): Promise<void> {
    await this.pages.plantsOrigin.selectCountry(country);
    await this.pages.plantsOrigin.btnSaveAndContinue.click();
    await this.pages.plantsArrivalDetails.heading.waitFor();
  }

  /**
   * Answers the arrival-status question, whose Continue goes on to the arrival
   * details — the next page of the same section, not the Overview.
   */
  async answerArrivalStatus(label: string): Promise<void> {
    await this.pages.plantsArrivalStatus.arrivalStatus(label).check();
    await this.pages.plantsArrivalStatus.btnSaveAndContinue.click();
    await this.pages.plantsArrivalDetails.heading.waitFor();
  }

  private async fillCommodityLine(values: CommodityLine): Promise<void> {
    for (const [label, value] of Object.entries(values)) {
      if (label === GENUS) {
        await this.pages.plantsCommodityDetails.selectGenus(value);
        continue;
      }
      await this.pages.plantsCommodityDetails.field(label).fill(value);
    }
  }

  async returnToDashboard(): Promise<void> {
    await this.pages.plantsOverview.btnReturnToDashboard.click();
    await this.pages.plantsDashboard.heading.waitFor();
  }

  /**
   * From the dashboard card, opens the delete confirmation page for that reference.
   * The listing is paginated over every notification the backend holds, so the card
   * is reached by searching for the reference rather than by paging to find it.
   */
  async deleteFromDashboard(reference: string): Promise<void> {
    await this.pages.plantsDashboard.searchForReference(reference);
    await this.pages.plantsDashboard.delete(reference).click();
    await this.pages.plantsDeleteNotification.heading.waitFor();
  }
}
