import { randomUUID } from 'node:crypto';
import type { PlantsPages } from '@page-objects';
import type { JourneyContext } from '@flows/shared/journey-context';
import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { portByCode } from '@domain/shared/fixtures/reference-data';

/**
 * One commodity line's answers, keyed by the label the trader reads. Which
 * labels a line carries is decided by its category, so the shape is open: a
 * caller writes exactly the fields that category asks for, and a missing or
 * surplus one shows up as the page rejecting the line.
 */
export type CommodityLine = Record<string, string>;

export type CategorisedLine = { category: string; line: CommodityLine };

export const POTATOES = 'Potatoes (seed or ware)';
export const PLANTS_FOR_PLANTING = 'Plants for planting';
export const WOOD_AND_CUT_TREES = 'Wood and cut trees';

export const SEED_POTATOES = 'Seed potatoes';
const CUT_CONIFEROUS_TREES = 'Cut coniferous trees more than 3 metres high';

export const potatoLine = { Variety: 'Maris Piper', Quantity: '250', 'Intended use': 'Planting' };

export const plantsLine = {
  Genus: 'Quercus (oak)',
  Species: 'Quercus robur',
  'Commodity code': '0602 20 20',
  Quantity: '120',
  'EPPO code': 'QUERO',
};

const coniferousTreesLine = {
  'Commodity code': '4403 25 10',
  Quantity: '40',
  'Size of the trees': '4.5',
  'Phytosanitary treatments applied': 'Kiln dried (KD)',
};

const DEFAULT_LINE_BY_COMMODITY_TYPE: Record<string, CategorisedLine> = {
  [POTATOES]: { category: SEED_POTATOES, line: potatoLine },
  [PLANTS_FOR_PLANTING]: { category: PLANTS_FOR_PLANTING, line: plantsLine },
  [WOOD_AND_CUT_TREES]: { category: CUT_CONIFEROUS_TREES, line: coniferousTreesLine },
};

const NOT_YET_ARRIVED = 'No, it has not arrived yet';

export const nurseryAddress = (name: string, countryCode = 'GB') => ({
  name,
  addressLine1: '4 Nursery Lane',
  townOrCity: 'Perth',
  county: 'Perthshire',
  postcode: 'PH1 5EX',
  countryCode,
  phone: '01738 555 0143',
  email: 'review@example.co.uk',
});

// Use London calendar dates, like the service, and stay away from timing boundaries.
export function arrivalDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' }).format(date);
}

type NotificationOptions = {
  type?: string;
  days?: number;
  contact?: boolean;
  /** The country the minted record carries. The address book API accepts any non-blank value; the journey does not. */
  countryCode?: string;
  /** The minted record's name. Must stay unique: the book is shared and never wiped. */
  name?: string;
  /** A record to pick instead of minting one, so two notifications can copy the same address. */
  existing?: AddressBookRecord;
};

const TYPE_AHEAD_FIELD = 'Genus';

export class PlantsJourney {
  constructor(
    private readonly plantsPages: PlantsPages,
    private readonly context: JourneyContext,
  ) {}

  async toDashboard(): Promise<void> {
    await this.plantsPages.dashboard.open();
    await this.plantsPages.dashboard.heading.waitFor();
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
    await this.plantsPages.dashboard.btnStartNewNotification.click();
    await this.plantsPages.commodityType.heading.waitFor();
    const journeyId = this.plantsPages.commodityType.journeyIdFromUrl();
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
    await this.plantsPages.commodityType.linkCancel.click();
    await this.plantsPages.overview.heading.waitFor();
  }

  /**
   * Answers the entry question. Continue leaves for the commodities list, and a
   * list with no lines sends the trader straight on to the entry sub-page — so
   * this lands on the commodity-details page, not on the list.
   */
  async chooseCommodityType(label: string): Promise<void> {
    await this.plantsPages.commodityType.commodityType(label).check();
    await this.plantsPages.commodityType.btnSaveAndContinue.click();
    await this.plantsPages.commodityDetails.heading.waitFor();
  }

  /**
   * Re-answers the entry question on a notification that is already under way.
   * A change that no saved line survives lands on the list rather than the
   * entry page, because the trader has to see what went.
   */
  async changeCommodityType(reference: string, label: string): Promise<void> {
    await this.plantsPages.commodityType.open(reference);
    await this.plantsPages.commodityType.commodityType(label).check();
    await this.plantsPages.commodityType.btnSaveAndContinue.click();
  }

  /**
   * Adds one line from the entry page, which is where the commodity type left
   * the trader. Choosing the category creates the line and brings back the
   * fields that category asks for, so the two steps cannot be collapsed.
   */
  async addCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.plantsPages.commodityDetails.category(category).check();
    await this.plantsPages.commodityDetails.btnContinue.click();
    await this.plantsPages.commodityDetails.btnSaveAndContinue.waitFor();
    await this.fillCommodityLine(values);
    await this.plantsPages.commodityDetails.btnSaveAndContinue.click();
    await this.plantsPages.commodities.heading.waitFor();
  }

  /** Adds a further line from the list page the last one returned to. */
  async addAnotherCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.plantsPages.commodities.btnAddAnother.click();
    await this.plantsPages.commodityDetails.heading.waitFor();
    await this.addCommodityLine(category, values);
  }

  /**
   * Leaves the commodities list for origin, which the list's Continue reaches
   * only while the opening run is still open. Once the run has ended,
   * commodities is the last page of its section and Continue returns to the
   * Overview instead — so a notification past its opening run reaches origin
   * with `plantsPages.origin.open(reference)`, not with this helper.
   */
  async toOrigin(): Promise<void> {
    await this.plantsPages.commodities.btnSaveAndContinue.click();
    await this.plantsPages.origin.heading.waitFor();
  }

  async toOriginOfNewNotification(
    commodityType: string,
    { category, line }: CategorisedLine = DEFAULT_LINE_BY_COMMODITY_TYPE[commodityType],
  ): Promise<string> {
    const reference = await this.startNotification();
    await this.chooseCommodityType(commodityType);
    await this.addCommodityLine(category, line);
    await this.toOrigin();
    return reference;
  }

  async toArrivalStatusOfNewPlantsNotification(): Promise<string> {
    const reference = await this.toOriginOfNewNotification(PLANTS_FOR_PLANTING);
    await this.toArrivalStatus('Germany');
    return reference;
  }

  async toArrivalDetailsOfNewPotatoNotification(): Promise<string> {
    const reference = await this.toOriginOfNewNotification(POTATOES);
    await this.toArrivalDetails('France');
    return reference;
  }

  /** Answers arrival as a pre-arrival notification and lands on the place of destination. */
  async toDestinationOfNewNotification(commodityType: string): Promise<string> {
    let reference: string;
    if (commodityType === POTATOES) {
      reference = await this.toArrivalDetailsOfNewPotatoNotification();
      await this.plantsPages.arrivalDetails.arrivalTime.fill('14:30');
      await this.plantsPages.arrivalDetails.selectPlaceOfLanding(portByCode('GB ABD').display);
    } else {
      reference = await this.toOriginOfNewNotification(commodityType);
      await this.toArrivalStatus('Germany');
      await this.answerArrivalStatus(NOT_YET_ARRIVED);
    }
    await this.plantsPages.arrivalDetails.arrivalDate.fill(arrivalDate(7));
    await this.plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await this.plantsPages.placeOfDestination.heading.waitFor();
    return reference;
  }

  async chooseDestination(addressName: string): Promise<void> {
    await this.plantsPages.placeOfDestination.searchFor(addressName);
    await this.plantsPages.placeOfDestination.address(addressName).check();
    await this.plantsPages.placeOfDestination.btnSaveAndContinue.click();
  }

  /**
   * Names the country and carries on to the arrival-status question, which only
   * plants for planting and wood and cut trees are asked. A potato
   * notification's Continue passes the question over and lands on the arrival
   * details instead, so it reaches the section through `toArrivalDetails`.
   */
  async toArrivalStatus(country: string): Promise<void> {
    await this.plantsPages.origin.selectCountry(country);
    await this.plantsPages.origin.btnSaveAndContinue.click();
    await this.plantsPages.arrivalStatus.heading.waitFor();
  }

  /**
   * Names the country and carries a potato notification straight on to the
   * arrival details. `arrivalStatus` is out of scope for potatoes, so the
   * opening run skips that step rather than stopping at it.
   */
  async toArrivalDetails(country: string): Promise<void> {
    await this.plantsPages.origin.selectCountry(country);
    await this.plantsPages.origin.btnSaveAndContinue.click();
    await this.plantsPages.arrivalDetails.heading.waitFor();
  }

  /**
   * Answers the arrival-status question, whose Continue goes on to the arrival
   * details — the next page of the same section, not the Overview.
   */
  async answerArrivalStatus(label: string): Promise<void> {
    await this.plantsPages.arrivalStatus.arrivalStatus(label).check();
    await this.plantsPages.arrivalStatus.btnSaveAndContinue.click();
    await this.plantsPages.arrivalDetails.heading.waitFor();
  }

  private async fillCommodityLine(values: CommodityLine): Promise<void> {
    for (const [label, value] of Object.entries(values)) {
      if (label === TYPE_AHEAD_FIELD) {
        await this.plantsPages.commodityDetails.selectGenus(value);
        continue;
      }
      await this.plantsPages.commodityDetails.field(label).fill(value);
    }
  }

  /**
   * A notification answered through to Check your answers, with one address-book
   * record picked for the place of destination and the contact (and the consignor,
   * for plants for planting). Mints the record unless `existing` names one.
   */
  async completeNotification(
    api: AddressBookApiClient,
    {
      type = POTATOES,
      days = 7,
      contact = true,
      countryCode = 'GB',
      name = `Review Nursery ${randomUUID()}`,
      existing,
    }: NotificationOptions = {},
  ): Promise<{ reference: string; address: AddressBookRecord }> {
    const address = existing ?? (await api.createAddress(nurseryAddress(name, countryCode)));
    const reference = await this.toOriginOfNewNotification(type);
    if (type === POTATOES) {
      await this.toArrivalDetails('France');
      await this.plantsPages.arrivalDetails.arrivalTime.fill('14:30');
      await this.plantsPages.arrivalDetails.selectPlaceOfLanding(portByCode('GB ABD').display);
    } else {
      await this.toArrivalStatus('Germany');
      await this.answerArrivalStatus('Yes, it has already arrived');
    }
    await this.plantsPages.arrivalDetails.arrivalDate.fill(arrivalDate(days));
    await this.plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await this.chooseDestination(address.name);
    if (type === PLANTS_FOR_PLANTING) {
      await this.plantsPages.consignorSelect.searchFor(address.name);
      await this.plantsPages.consignorSelect.address(address.name).check();
      await this.plantsPages.consignorSelect.btnSaveAndContinue.click();
      await this.plantsPages.identificationNumbers.supplier.fill('S123');
    } else {
      await this.plantsPages.identificationNumbers.producer.fill('P123');
      await this.plantsPages.identificationNumbers.crop.fill('C123');
    }
    await this.plantsPages.identificationNumbers.btnSaveAndContinue.click();
    if (contact) {
      await this.plantsPages.consignmentContactSelect.searchFor(address.name);
      await this.plantsPages.consignmentContactSelect.address(address.name).check();
    }
    await this.plantsPages.consignmentContactSelect.btnSaveAndContinue.click();
    await this.plantsPages.notificationView.heading.waitFor();
    return { reference, address };
  }

  async submitFromReview(): Promise<void> {
    await this.plantsPages.notificationView.btnContinue.click();
    await this.plantsPages.declaration.checkbox.check();
    await this.plantsPages.declaration.btnContinue.click();
    await this.plantsPages.confirmation.heading.waitFor();
  }

  async returnToDashboard(): Promise<void> {
    await this.plantsPages.overview.btnReturnToDashboard.click();
    await this.plantsPages.dashboard.heading.waitFor();
  }

  /**
   * From the dashboard card, opens the delete confirmation page for that reference.
   * The listing is paginated over every notification the backend holds, so the card
   * is reached by searching for the reference rather than by paging to find it.
   */
  async deleteFromDashboard(reference: string): Promise<void> {
    await this.plantsPages.dashboard.searchForReference(reference);
    await this.plantsPages.dashboard.delete(reference).click();
    await this.plantsPages.deleteNotification.heading.waitFor();
  }
}
