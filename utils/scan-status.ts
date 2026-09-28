import { expect, test, type Locator } from '@playwright/test';

export const SCANNING_STATUS = 'Scanning for virus';

export type FirstScanStatus = {
  pending: boolean;
  text: string;
};

/**
 * Waits for a document row to show its first scan status and reports whether
 * that status is still pending. A real scanner can settle a small file before
 * the redirected page renders, so the pending state is not guaranteed; the
 * local upload stub holds it until a refresh read. Run pending-state checks
 * only when `pending` is true. The run's report records when the scanner won.
 */
export const firstScanStatus = async (row: Locator, settledStatus: string): Promise<FirstScanStatus> => {
  await expect(row).toContainText(new RegExp(`${SCANNING_STATUS}|${settledStatus}`));
  const text = (await row.textContent()) ?? '';
  const pending = text.includes(SCANNING_STATUS);
  if (!pending) {
    test.info().annotations.push({
      type: 'scan settled before first render',
      description: `The row already read "${settledStatus}", so the pending-state checks did not run.`,
    });
  }
  return { pending, text };
};
