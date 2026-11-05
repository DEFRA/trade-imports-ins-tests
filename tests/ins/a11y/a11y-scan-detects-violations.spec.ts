import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { injectAdjacentSmallTargets, injectUnnamedButton, scanPage } from '@utils/a11y-utils';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ insPages }) => {
    await insPages.dashboard.open();
  });

  test('the scan reports an unnamed button and targets too small and too close to press', async ({ page }) => {
    await injectUnnamedButton(page);
    await injectAdjacentSmallTargets(page);

    const { violations } = await scanPage(page, { tags: [...WCAG_STANDARD.tags] });

    expect(violations.map(({ id }) => id)).toEqual(expect.arrayContaining(['button-name', 'target-size']));
  });

  test.describe('failing the test', () => {
    test.describe.configure({ retries: 0 });

    test.fail('the a11y scan fixture fails the test when the page has a violation', async ({ page, runA11yScan }) => {
      await injectUnnamedButton(page);

      await runA11yScan();
    });
  });
});
