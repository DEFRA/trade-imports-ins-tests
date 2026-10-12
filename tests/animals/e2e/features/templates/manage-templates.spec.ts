import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createAnimalsPages } from '@page-objects';
import { users } from '@config/users';

const FEEDBACK_MAILTO = 'mailto:APHAServiceDesk@apha.gov.uk';

test.describe('Manage templates', { tag: '@integration' }, () => {
  test('shows the Manage templates page with its heading, intro line and phase banner, and no Back link', async ({
    pages,
    animalsPages,
  }) => {
    const { manageTemplates } = animalsPages;

    await manageTemplates.open();

    await expect(pages.page).toHaveURL(new RegExp(`${manageTemplates.expectedUrl}$`));
    await expect(pages.page).toHaveTitle('Manage templates - Import notification service - GOV.UK');
    await expect(manageTemplates.heading).toBeVisible();
    await expect(manageTemplates.intro).toBeVisible();
    await expect(manageTemplates.myTemplatesHeading).toBeVisible();
    await expect(manageTemplates.resultsCount).toBeVisible();
    await expect(manageTemplates.linkBack).toHaveCount(0);
    await expect(manageTemplates.phaseBannerFeedbackLink).toHaveAttribute('href', FEEDBACK_MAILTO);
    await expect(pages.page.getByText('This is a new service. Help us improve it and')).toBeVisible();
  });

  test('shows a user who has never saved a template a zero count and no templates', async ({ browser }) => {
    // Sarah starts cold. This identity never saves a template in any spec, so its list is always empty.
    const context = await browser.newContext({ storageState: COLD_START });
    try {
      const page = await context.newPage();
      const { manageTemplates } = createAnimalsPages(page);

      await manageTemplates.open(true, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(page.getByText('Show 0 of 0 results', { exact: true })).toBeVisible();
      await expect(manageTemplates.templateCards).toHaveCount(0);
      await expect(manageTemplates.sortControl).toHaveCount(0);
      await expect(manageTemplates.sortByText).toHaveCount(0);
      await expect(manageTemplates.searchControls).toHaveCount(0);
      await expect(manageTemplates.pagination).toHaveCount(0);
      // The only body text is the intro and the count, so there is no empty-state message.
      await expect(manageTemplates.bodyParagraphs).toHaveCount(2);
    } finally {
      await context.close();
    }
  });
});
