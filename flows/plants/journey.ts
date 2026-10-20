import { randomUUID } from 'node:crypto';
import type { PlantsPages } from '@page-objects';
import type { JourneyContext } from '@flows/shared/journey-context';
import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { portByCode } from '@domain/shared/fixtures/reference-data';

/** One commodity line's answers, keyed by field label. The fields a line needs depend on its category. */
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

const ALREADY_ARRIVED = 'Yes, it has already arrived';
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

export function arrivalDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London' }).format(date);
}

type ArrivalAnswers = {
  arrivalStatus?: string;
  days?: number;
};

type NotificationOptions = {
  type?: string;
  days?: number;
  contact?: boolean;
  /** The country the minted record carries. */
  countryCode?: string;
  /** The minted record's name. Must be unique: the address book is shared and never wiped. */
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

  /** Creates a notification, lands on the commodity-type page and returns its reference number. */
  async startNotification(): Promise<string> {
    await this.toDashboard();
    await this.plantsPages.dashboard.btnStartNewNotification.click();
    await this.plantsPages.commodityType.heading.waitFor();
    const referenceNumber = this.plantsPages.commodityType.referenceNumberFromUrl();
    this.context.recordReferenceNumber(referenceNumber);
    return referenceNumber;
  }

  /** Leaves the commodity-type page for the Overview by Cancel, which saves nothing. */
  async toOverview(): Promise<void> {
    await this.plantsPages.commodityType.linkCancel.click();
    await this.plantsPages.overview.heading.waitFor();
  }

  /** Answers the commodity type and lands on the commodity-details page. */
  async chooseCommodityType(label: string): Promise<void> {
    await this.plantsPages.commodityType.commodityType(label).check();
    await this.plantsPages.commodityType.btnSaveAndContinue.click();
    await this.plantsPages.commodityDetails.heading.waitFor();
  }

  async changeCommodityType(reference: string, label: string): Promise<void> {
    await this.plantsPages.commodityType.open(reference);
    await this.plantsPages.commodityType.commodityType(label).check();
    await this.plantsPages.commodityType.btnSaveAndContinue.click();
  }

  /** Adds one line from the commodity-details page and lands on the commodities list. */
  async addCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.plantsPages.commodityDetails.category(category).check();
    await this.plantsPages.commodityDetails.btnContinue.click();
    await this.plantsPages.commodityDetails.btnSaveAndContinue.waitFor();
    await this.fillCommodityLine(values);
    await this.plantsPages.commodityDetails.btnSaveAndContinue.click();
    await this.plantsPages.commodities.heading.waitFor();
  }

  async addAnotherCommodityLine(category: string, values: CommodityLine): Promise<void> {
    await this.plantsPages.commodities.btnAddAnother.click();
    await this.plantsPages.commodityDetails.heading.waitFor();
    await this.addCommodityLine(category, values);
  }

  /** Continues from the commodities list to origin. Works only while the opening run is still open. */
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

  /** Answers the arrival section and lands on the place of destination. Pre-arrival, a week ahead, unless told otherwise. */
  async toDestinationOfNewNotification(
    commodityType: string,
    { arrivalStatus = NOT_YET_ARRIVED, days = 7 }: ArrivalAnswers = {},
  ): Promise<string> {
    let reference: string;
    if (commodityType === POTATOES) {
      reference = await this.toArrivalDetailsOfNewPotatoNotification();
      await this.plantsPages.arrivalDetails.arrivalTime.fill('14:30');
      await this.plantsPages.arrivalDetails.selectPlaceOfLanding(portByCode('GB ABD').display);
    } else {
      reference = await this.toOriginOfNewNotification(commodityType);
      await this.toArrivalStatus('Germany');
      await this.answerArrivalStatus(arrivalStatus);
    }
    await this.plantsPages.arrivalDetails.arrivalDate.fill(arrivalDate(days));
    await this.plantsPages.arrivalDetails.btnSaveAndContinue.click();
    await this.plantsPages.placeOfDestination.heading.waitFor();
    return reference;
  }

  async chooseDestination(addressName: string): Promise<void> {
    await this.plantsPages.placeOfDestination.searchFor(addressName);
    await this.plantsPages.placeOfDestination.address(addressName).check();
    await this.plantsPages.placeOfDestination.btnSaveAndContinue.click();
  }

  /** Names the country and lands on the arrival-status question. Not for potatoes, which skip it: use `toArrivalDetails`. */
  async toArrivalStatus(country: string): Promise<void> {
    await this.plantsPages.origin.selectCountry(country);
    await this.plantsPages.origin.btnSaveAndContinue.click();
    await this.plantsPages.arrivalStatus.heading.waitFor();
  }

  /** Names the country on a potato notification and lands on the arrival details. */
  async toArrivalDetails(country: string): Promise<void> {
    await this.plantsPages.origin.selectCountry(country);
    await this.plantsPages.origin.btnSaveAndContinue.click();
    await this.plantsPages.arrivalDetails.heading.waitFor();
  }

  /** Answers the arrival-status question and lands on the arrival details. */
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
   * Answers a notification through to Check your answers, picking one address-book
   * record for the place of destination and the contact (and the consignor, for
   * plants for planting). Mints the record unless `existing` names one.
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
    const reference = await this.toDestinationOfNewNotification(type, { arrivalStatus: ALREADY_ARRIVED, days });
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

  /** Searches the dashboard for the reference and opens its delete confirmation page. */
  async deleteFromDashboard(reference: string): Promise<void> {
    await this.plantsPages.dashboard.searchForReference(reference);
    await this.plantsPages.dashboard.delete(reference).click();
    await this.plantsPages.deleteNotification.heading.waitFor();
  }
}
