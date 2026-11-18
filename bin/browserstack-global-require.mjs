import { createRequire } from 'node:module';

// When a proxy is set, as on CDP, the BrowserStack SDK's generated Playwright config calls `require`, which ES modules lack.
globalThis.require = createRequire(`${process.cwd()}/`);
