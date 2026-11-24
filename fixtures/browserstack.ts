import { test as base } from '@playwright/test';

const IOS_TAG = '@ios';

const BROWSERSTACK_IOS_PROJECT = /^safari-.+-browserstack-mobile$/;

export const test = base.extend<{ skipUntaggedTestsOnIos: void }>({
  skipUntaggedTestsOnIos: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      const untaggedOnIos = BROWSERSTACK_IOS_PROJECT.test(testInfo.project.name) && !testInfo.tags.includes(IOS_TAG);
      testInfo.skip(untaggedOnIos, `Real iOS devices on BrowserStack run only tests tagged ${IOS_TAG}. See docs/cross-browser.md.`);
      await use();
    },
    { auto: true },
  ],
});
