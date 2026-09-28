export const sortByValues = {
  arrivalNewestToOldest: 'Arrival (newest to oldest)',
  arrivalOldestToNewest: 'Arrival (oldest to newest)',
  dateCreatedNewestToOldest: 'Date created (newest to oldest)',
  dateCreatedOldestToNewest: 'Date created (oldest to newest)',
} as const;

export type SortByValue = (typeof sortByValues)[keyof typeof sortByValues];
