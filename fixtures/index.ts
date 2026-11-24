import { mergeTests } from '@playwright/test';
import { test as uiTest } from './ui';
import { test as browserStackTest } from './browserstack';

export * from './ui';

export const test = mergeTests(uiTest, browserStackTest);
