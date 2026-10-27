import { test, expect } from '@fixtures';

test.describe('Documents entry flow', { tag: '@duplicated-in-frontend' }, () => {
  test('opens the upload documents page from Overview with only the origin answered', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Upload documents').click();

    await expect(animalsPages.accompanyingDocuments.heading).toBeVisible();
  });
});
