import { type Page } from '@playwright/test';

/**
 * Records, in order, the path (without query string) of every main-frame document navigation request
 * the page sends to one origin, each hop of a redirect chain included. Sub-resource requests are ignored.
 * The returned list grows as the page navigates.
 */
export function recordMainFrameNavigationPaths(page: Page, origin: string): string[] {
  const paths: string[] = [];
  page.on('request', (request) => {
    if (!request.isNavigationRequest() || request.frame() !== page.mainFrame()) return;
    const url = new URL(request.url());
    if (url.origin === origin) paths.push(url.pathname);
  });
  return paths;
}
