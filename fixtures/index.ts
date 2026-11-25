import { mergeTests } from '@playwright/test';
import { test as uiTest } from './ui';
import { test as browserStackTest } from './browserstack';

export * from './ui';

const isBrowserStackRun = Boolean(process.env.BROWSERSTACK_BUILD_IDENTIFIER);

export const test = isBrowserStackRun ? mergeTests(uiTest, browserStackTest) : uiTest;
