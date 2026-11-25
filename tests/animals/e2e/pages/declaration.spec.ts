import { CONSIGNMENT_ADDRESSES_INCOMPLETE } from '@domain/animals/constants/consignment-addresses-page';
import { test, expect } from '@fixtures';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { todayOrTomorrowServiceDisplayDatePattern } from '@utils/date-utils';

test.describe('Declaration page', { tag: '@duplicated-in-frontend' }, () => {
  test.describe('for a draft', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsJourney }) => {
      await animalsSeededJourney.createDraftNotification();
      await animalsJourney.toDeclarationOfCurrentNotification();
    });

    test('renders the page controls', { tag: '@cross-browser' }, async ({ animalsPages }) => {
      await expect(animalsPages.declaration.heading).toBeVisible();
      await expect(animalsPages.declaration.confirmation).toBeVisible();
      await expect(animalsPages.declaration.continueButton).toBeVisible();
    });

    test('shows an error summary when submitted unconfirmed', { tag: '@cross-browser' }, async ({ pages, animalsPages }) => {
      await animalsPages.declaration.continueButton.click();

      await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    });

    test('puts the confirmation checkbox in a group named by the declaration legend', async ({ animalsPages }) => {
      await expect(animalsPages.declaration.content.confirmationGroup).toBeVisible();
      await expect(animalsPages.declaration.content.confirmationCheckbox).toBeVisible();
    });

    test('shows the date of declaration as the strong text of its line', async ({ animalsPages }) => {
      await expect(animalsPages.declaration.content.dateValue).toHaveText(new RegExp(`^${todayOrTomorrowServiceDisplayDatePattern()}$`));
    });
  });

  test.describe('for an unfinished draft', () => {
    test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
      await animalsSeededJourney.createDraftNotification('unlocked');
      await animalsSeededJourney.postDeclarationOfUnfinishedDraft(journeyContext.referenceNumber);
      await animalsNotificationActions.toRefusedNotificationView(journeyContext.referenceNumber);
    });

    test('a declaration posted for an unfinished draft is refused back to the review, naming each unfinished card, and the notification stays a draft', async ({
      animalsPages,
    }) => {
      await expect(animalsPages.notificationView.errorSummaryLinks).toHaveText([
        'Complete main import reason',
        'Complete additional details',
        'Complete arrival details',
        'Complete transport details',
        CONSIGNMENT_ADDRESSES_INCOMPLETE,
      ]);
      await expect(animalsPages.notificationView.viewHeader.statusTag).toHaveText('Draft');
    });
  });

  for (const { question, unanswered, errorLink, card, blankRow, answeredRows } of [
    {
      question: 'main import reason',
      unanswered: 'mainImportReason',
      errorLink: 'Complete main import reason',
      card: 'Main import reason',
      blankRow: 'Main import reason',
      answeredRows: [],
    },
    {
      question: 'certified-for answer',
      unanswered: 'certifiedFor',
      errorLink: 'Complete additional details',
      card: 'Additional details',
      blankRow: 'Certified for',
      answeredRows: [{ key: 'Includes unweaned animals', value: MANDATORY_ANSWERS.unweanedAnimals }],
    },
    {
      question: 'unweaned answer',
      unanswered: 'unweaned',
      errorLink: 'Complete additional details',
      card: 'Additional details',
      blankRow: 'Includes unweaned animals',
      answeredRows: [{ key: 'Certified for', value: MANDATORY_ANSWERS.certifiedFor.display }],
    },
  ] as const) {
    test.describe(`for an otherwise complete draft whose ${question} was left blank`, () => {
      test.beforeEach(async ({ animalsSeededJourney, animalsNotificationActions, journeyContext }) => {
        await animalsSeededJourney.createDraftNotification('ready', MANDATORY_ANSWERS, { leaveUnanswered: [unanswered] });
        await animalsSeededJourney.postDeclarationOfUnfinishedDraft(journeyContext.referenceNumber);
        await animalsNotificationActions.toRefusedNotificationView(journeyContext.referenceNumber);
      });

      test(`refuses a declaration with the ${question} left blank, naming only its card and keeping the draft`, async ({
        animalsPages,
      }) => {
        const { notificationView } = animalsPages;
        await expect(notificationView.errorSummaryLinks).toHaveText([errorLink]);
        await expect(notificationView.summaryValue(notificationView.summaryCard(card), blankRow)).toHaveText('Missing');
        for (const { key, value } of answeredRows) {
          await expect(notificationView.summaryValue(notificationView.summaryCard(card), key)).toHaveText(value);
        }
        await expect(notificationView.viewHeader.statusTag).toHaveText('Draft');
      });
    });
  }

  for (const { state, seed } of [
    { state: 'a draft', seed: (journey: AnimalsSeededJourney) => journey.createDraftNotification() },
    { state: 'an amendment', seed: (journey: AnimalsSeededJourney) => journey.createAmendNotification() },
  ]) {
    test(`starts the declaration of ${state} with the Declaration heading`, async ({
      animalsSeededJourney,
      animalsJourney,
      animalsPages,
    }) => {
      await seed(animalsSeededJourney);
      await animalsJourney.toDeclarationOfCurrentNotification();

      await expect(animalsPages.declaration.content.firstContentElement).toHaveText('Declaration');
    });
  }
});
