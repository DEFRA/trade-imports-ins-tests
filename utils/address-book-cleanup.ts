import {
  AddressBookApiClient,
  type AddressBookRecord,
  type AddressBookRequest,
  type TransporterRecord,
  type TransporterRequest,
} from '@adapters/http/address-book-api-client';

/** An address book client that remembers every record created or tracked through it, and deletes them all on request. */
export class RecordTrackingAddressBookApiClient extends AddressBookApiClient {
  private readonly trackedAddressIds: string[] = [];
  private readonly trackedTransporterIds: string[] = [];

  override async createAddress(request: AddressBookRequest): Promise<AddressBookRecord> {
    const created = await super.createAddress(request);
    this.trackedAddressIds.push(created.id);
    return created;
  }

  override async createTransporter(request: TransporterRequest): Promise<TransporterRecord> {
    const created = await super.createTransporter(request);
    this.trackedTransporterIds.push(created.id);
    return created;
  }

  /** The live transporter with this name, tracked for deletion. Throws unless exactly one live transporter has it. */
  async trackTransporterNamed(name: string): Promise<TransporterRecord> {
    const stored = await this.findTransporterByName(name);
    this.trackedTransporterIds.push(stored.id);
    return stored;
  }

  /** Soft-deletes every tracked record one at a time, logging each delete that fails. Never throws. */
  async deleteTrackedRecordsOneByOne(): Promise<void> {
    const deletes = [
      ...this.trackedAddressIds.splice(0).map((id) => ({ record: `address ${id}`, remove: () => this.deleteAddress(id) })),
      ...this.trackedTransporterIds.splice(0).map((id) => ({ record: `transporter ${id}`, remove: () => this.deleteTransporter(id) })),
    ];
    for (const { record, remove } of deletes) {
      try {
        await remove();
      } catch (error) {
        console.warn(`Could not delete ${record} after the test`, error);
      }
    }
  }
}
