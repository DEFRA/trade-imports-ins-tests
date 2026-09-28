import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, draft)', { tag: '@active' }, () => {
  test('routes a draft validation error through the ZAP proxy', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toOriginOfImport();

    // Fresh, unsubmitted draft — a region code claimed but not given is real
    // input-accepting attack surface the sibling frontend-notification-journey
    // spec's submit-only happy path never generates. (Country of origin alone
    // no longer blocks the save — see origin/controller.js's oneOf swap for
    // parity-dr1 — so this is the field still enforced on submit.)
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();

    await animalsJourney.fillOriginOfImport();
    await animalsJourney.saveOriginOfImport();

    // A fresh notification's first section is a linear step, not hub-driven
    // (see journey.ts's answerOrigin(), which enters Origin via the overview
    // task list instead) — a valid save here advances straight to the next
    // step rather than returning to Overview.
    await animalsPages.commoditySelection.heading.waitFor();
  });
});
