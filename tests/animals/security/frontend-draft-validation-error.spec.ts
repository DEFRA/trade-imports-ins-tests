import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, draft)', { tag: '@active' }, () => {
  test('routes a draft validation error through the ZAP proxy', async ({ journey, pages }) => {
    await journey.toOriginOfImport();

    // Fresh, unsubmitted draft — a region code claimed but not given is real
    // input-accepting attack surface the sibling frontend-notification-journey
    // spec's submit-only happy path never generates. (Country of origin alone
    // no longer blocks the save — see origin/controller.js's oneOf swap for
    // parity-dr1 — so this is the field still enforced on submit.)
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('Yes').check();
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.originOfImport.errorSummary).toBeVisible();

    await journey.fillOriginOfImport();
    await journey.saveOriginOfImport();

    // A fresh notification's first section is a linear step, not hub-driven
    // (see journey.ts's answerOrigin(), which enters Origin via the overview
    // task list instead) — a valid save here advances straight to the next
    // step rather than returning to Overview.
    await pages.commoditySelection.heading.waitFor();
  });
});
