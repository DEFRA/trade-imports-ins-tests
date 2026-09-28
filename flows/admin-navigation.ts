import type { AnimalsAdminPages } from '@page-objects';

export class AdminNavigation {
  constructor(private readonly animalsAdminPages: AnimalsAdminPages) {}

  async toAdminDashboard(): Promise<void> {
    await this.animalsAdminPages.dashboard.open();
  }

  async toNotifications(): Promise<void> {
    await this.toAdminDashboard();
    await this.animalsAdminPages.dashboard.btnNotifications.click();
  }

  async toOutboxEvents(referenceNumber?: string): Promise<void> {
    await this.toAdminDashboard();
    await this.animalsAdminPages.dashboard.btnOutboxEvents.click();
    if (referenceNumber) {
      await this.animalsAdminPages.outboxEvents.inputReferenceNumber.fill(referenceNumber);
      await this.animalsAdminPages.outboxEvents.btnSearch.click();
    }
  }

  async toDlqEvents(): Promise<void> {
    await this.toAdminDashboard();
    await this.animalsAdminPages.dashboard.btnDlqProcess.click();
  }
}
