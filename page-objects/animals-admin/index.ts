import { type Page } from '@playwright/test';
import { AnimalsAdminAboutPage } from '@page-objects/animals-admin/about-page';
import { AnimalsAdminDashboardPage } from '@page-objects/animals-admin/dashboard-page';
import { AnimalsAdminDlqEventsPage } from '@page-objects/animals-admin/dlq-events-page';
import { AnimalsAdminNotificationsPage } from '@page-objects/animals-admin/notifications-page';
import { AnimalsAdminOutboxEventsPage } from '@page-objects/animals-admin/outbox-events-page';

export function createAnimalsAdminPages(page: Page) {
  return {
    about: new AnimalsAdminAboutPage(page),
    dashboard: new AnimalsAdminDashboardPage(page),
    dlqEvents: new AnimalsAdminDlqEventsPage(page),
    notifications: new AnimalsAdminNotificationsPage(page),
    outboxEvents: new AnimalsAdminOutboxEventsPage(page),
  };
}

export type AnimalsAdminPages = ReturnType<typeof createAnimalsAdminPages>;
