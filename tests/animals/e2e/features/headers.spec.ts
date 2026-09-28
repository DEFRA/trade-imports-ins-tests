import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';

test('promoted frontend sends a Content-Security-Policy header', { tag: '@integration' }, async ({ journey, pages }) => {
  await journey.toNotificationDashboard();
  // The dashboard is the set's own base, not the root — reloading it fetches
  // `/live-animals`, so matching on `/` would wait for a document that never comes.
  const responsePromise = pages.page.waitForResponse(
    (response) => new URL(response.url()).pathname === SET_BASES.liveAnimals && response.request().resourceType() === 'document',
  );
  await pages.page.reload();
  const response = await responsePromise;
  expect(response.headers()['content-security-policy']).toBeTruthy();
});
