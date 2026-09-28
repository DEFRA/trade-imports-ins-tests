import fs from 'node:fs';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type Outcome = ReturnType<TestCase['outcome']>;

type FailedSummary = {
  finished: number;
  passed: number;
  flaky: number;
  retries: number;
  failed: number;
};

const FAILED_FILE = 'FAILED';

/**
 * Writes the FAILED marker the CDP test-suite entrypoint reads. A test counts
 * as failed only when its final outcome is unexpected; a test that failed and
 * then passed on retry is flaky and does not fail the suite.
 */
class FailedSuiteReporter implements Reporter {
  private readonly outcomes = new Map<TestCase, Outcome>();
  private retries = 0;

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.retry > 0) {
      this.retries += 1;
    }
    this.outcomes.set(test, test.outcome());
  }

  onEnd(result: FullResult): void {
    const summary: FailedSummary = { finished: 0, passed: 0, flaky: 0, retries: this.retries, failed: 0 };

    for (const outcome of this.outcomes.values()) {
      if (outcome === 'skipped') continue;
      summary.finished += 1;
      if (outcome === 'expected') {
        summary.passed += 1;
      } else if (outcome === 'flaky') {
        summary.flaky += 1;
      } else {
        summary.failed += 1;
      }
    }

    if (summary.failed > 0 || result.status === 'failed') {
      fs.writeFileSync(FAILED_FILE, JSON.stringify(summary));
    } else if (fs.existsSync(FAILED_FILE)) {
      fs.rmSync(FAILED_FILE);
    }
  }
}

export default FailedSuiteReporter;
