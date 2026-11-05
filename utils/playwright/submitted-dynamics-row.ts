import { expect } from '@playwright/test';
import { animalsDynamics } from '@config/animals-dynamics';
import type { AnimalsDynamicsClient } from '@adapters/http/animals-dynamics-client';
import type { NotificationAnswers } from '@domain/animals/constants/journey-options';
import type { AnimalsDynamicsImporterNotification } from '@domain/animals/models/dynamics/importer-notification';
import type { AnimalsJourney } from '@flows/animals/journey';
import type { JourneyContext } from '@flows/shared/journey-context';
import { annotateDuration } from '@utils/playwright/annotate-duration';

/** Submits the journey's notification, polls PIMS Dynamics until exactly one row has landed for it, and returns that row. */
export async function submittedDynamicsRow(
  animalsJourney: AnimalsJourney,
  journeyContext: JourneyContext,
  dynamics: AnimalsDynamicsClient,
  answers: NotificationAnswers,
): Promise<AnimalsDynamicsImporterNotification> {
  await animalsJourney.submitNotification(answers);
  const referenceNumber = journeyContext.referenceNumber;

  await annotateDuration(animalsDynamics.submissionPollAnnotation, () =>
    expect
      .poll(
        () => dynamics.findNotifications(referenceNumber),
        animalsDynamics.pollOptions(`Expected exactly one notification for ${referenceNumber}`),
      )
      .toHaveLength(1),
  );
  const [row] = await dynamics.findNotifications(referenceNumber);
  return row;
}
