import { test } from '@fixtures';

/** Registers an `afterEach` that soft-deletes every transporter id pushed onto the returned array. */
export const transporterIdsDeletedAfterEachTest = (): string[] => {
  const createdTransporterIds: string[] = [];
  test.afterEach(async ({ addressBookApi }) => {
    for (const transporterId of createdTransporterIds.splice(0)) {
      await addressBookApi.deleteTransporter(transporterId);
    }
  });
  return createdTransporterIds;
};
