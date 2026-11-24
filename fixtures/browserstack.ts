import { test as base } from '@playwright/test';

const BROWSERSTACK_IOS_PROJECT = /^safari-.+-browserstack-mobile$/;

export const test = base.extend<{ skipTestsWithoutPlatformTag: void }>({
  skipTestsWithoutPlatformTag: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      const requiredTag = BROWSERSTACK_IOS_PROJECT.test(testInfo.project.name) ? '@ios' : '@cross-browser';
      testInfo.skip(
        !testInfo.tags.includes(requiredTag),
        `BrowserStack runs only tests tagged ${requiredTag} on this platform. See docs/cross-browser.md.`,
      );
      await use();
    },
    { auto: true },
  ],
});
