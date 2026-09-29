/**
 * Seed a notification via the frontend's own save-and-continue routes and print
 * its reference number. Companion to the staleness-tools CLI on
 * trade-imports-animals-frontend — one command to make a notification, one to
 * mutate it:
 *
 *     REF=$(npm run --silent seed:notification -- --state draft)
 *     MONGODB_URI=mongodb://localhost:27017 npm --prefix ../trade-imports-animals-frontend \
 *       run seed:stale -- --scenario country-stale --ref $REF
 *
 * Uses AnimalsSeededJourney unchanged — same POSTs the E2E tests use, so anything the
 * tests keep in sync (page order, required fields) flows through.
 *
 * Signs in via `createAuthState` — the same Chromium flow the tests use — so
 * a real Defra ID stub is authenticated the same way as an in-test worker.
 * Base URLs default to the compose stack's own values; set the env vars to
 * target somewhere else.
 */
import dotenv from 'dotenv';
import { chromium, request } from '@playwright/test';
import { createAuthState } from '@fixtures/auth-state';
import { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { ensureE2eAddressBook } from '@domain/shared/fixtures/e2e-address-book';
import type { JourneyContext } from '@flows/shared/journey-context';

dotenv.config({ quiet: true });

// Compose-stack defaults, matching playwright.docker-compose.config.ts. Read
// only if the env has not already set them — so a CDP / non-local run still
// works if the caller sets its own values.
process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL ??= 'http://localhost:3000';
process.env.TRADE_IMPORTS_ADDRESS_BOOK_URL ??= 'http://localhost:8089';

type State = 'draft' | 'submitted' | 'amend';

const parseState = (argv: readonly string[]): State => {
  const index = argv.indexOf('--state');
  const value = index >= 0 ? argv[index + 1] : 'submitted';
  if (value !== 'draft' && value !== 'submitted' && value !== 'amend') {
    throw new Error(`--state must be one of draft|submitted|amend, got: ${value ?? '(missing)'}`);
  }
  return value;
};

const seed = async (state: State, journey: AnimalsSeededJourney): Promise<string> => {
  if (state === 'draft') return journey.createDraftNotification();
  if (state === 'amend') return journey.createAmendNotification();
  return journey.createSubmittedNotification();
};

const main = async (): Promise<void> => {
  const state = parseState(process.argv.slice(2));
  const baseURL = process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL;

  const browser = await chromium.launch();
  try {
    // Same sign-in path the tests use: launch a headless browser, drive the
    // sign-in page with the default local credentials, capture the auth
    // cookie. `createAuthState` writes to playwright/.auth/ under the tests
    // repo's cwd — subsequent runs reuse the file until it expires.
    const storageState = await createAuthState(browser, {
      targetName: 'animals',
      baseURL,
      workerIndex: 0,
    });
    const context = await request.newContext({ baseURL, storageState });
    try {
      const addressBook = new AddressBookApiClient(context);
      // Idempotent — matches Playwright's globalSetup so the party pickers can
      // find the shared journey fixtures by name.
      await ensureE2eAddressBook(addressBook);
      const forms = new FrontendFormClient(context);
      const journeyContext: JourneyContext = {};
      const journey = new AnimalsSeededJourney(forms, addressBook, journeyContext);
      const ref = await seed(state, journey);
      console.log(ref);
    } finally {
      await context.dispose();
    }
  } finally {
    await browser.close();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
