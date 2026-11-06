import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the blank Choose an address type page has no accessibility violations', async ({ insJourney, runA11yScan }) => {
    await insJourney.toAddressType();

    await runA11yScan();
  });

  test('the blank add address form has no accessibility violations', async ({ insJourney, runA11yScan }) => {
    await insJourney.toAddressForm();

    await runA11yScan();
  });
});
