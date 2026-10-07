import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the copied-address edit page and the contact page with a current contact have no accessibility violations', async ({
    animalsSeededJourney,
    animalsPages,
    runA11yScan,
  }) => {
    const journeyId = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    await test.step('Consignment addresses with Change and Edit details on every role', async () => {
      await animalsSeededJourney.resumeInUi(journeyId, animalsPages.addresses);
      await runA11yScan();
    });

    await test.step('Edit address details, filled with the copy', async () => {
      await animalsPages.addresses.editPartyDetails('Consignor or exporter').click();
      await animalsPages.consignorEdit.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Edit address details with validation errors', async () => {
      await animalsPages.consignorEdit.fill({ name: '', email: 'not-an-email' });
      await animalsPages.consignorEdit.saveChanges.click();
      await expect(animalsPages.consignorEdit.errorSummary).toBeVisible();
      await runA11yScan();
    });

    await test.step('Contact address with the current contact shown', async () => {
      await animalsSeededJourney.resumeInUi(journeyId, animalsPages.contactAddress);
      await animalsPages.contactAddress.currentContact.waitFor();
      await runA11yScan();
    });
  });
});
