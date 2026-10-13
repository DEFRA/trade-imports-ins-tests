import { test, expect } from '@fixtures';
import { ARRIVAL_DATE_AT_PORT_OBLIGATION_ID } from '@domain/animals/constants/obligation-ids';
import { getRelativeAppDateParts } from '@utils/date-utils';

const ARRIVAL_DETAILS_TASK = 'Arrival details';
const NO_LONGER_IN_WINDOW = 'The saved arrival date is no longer a date you can choose. Enter a new arrival date.';

test.describe('Arrival details when the saved arrival date goes stale', () => {
  test('overview: when the saved arrival date is now more than 7 days in the past, Arrival details reads To do and the page names the date', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    notificationApi,
  }) => {
    // Arrange
    const reference = await animalsSeededJourney.createDraftNotification('draft');
    await animalsPages.overview.open(reference);
    await expect(animalsPages.overview.taskStatus(ARRIVAL_DETAILS_TASK)).toHaveText('Complete');
    await notificationApi.overwriteStoredAnswer(reference, ARRIVAL_DATE_AT_PORT_OBLIGATION_ID, getRelativeAppDateParts({ dayOffset: -8 }));

    // Act
    await animalsPages.overview.open(reference);

    // Assert
    await expect(animalsPages.overview.taskStatus(ARRIVAL_DETAILS_TASK)).toHaveText('To do');
    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummary).toBeVisible();
    await expect(pages.page.getByRole('link', { name: NO_LONGER_IN_WINDOW })).toBeVisible();
  });
});
