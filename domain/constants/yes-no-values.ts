export const yesNoValues = {
  yes: 'Yes',
  no: 'No',
} as const;

export type YesNoValue = (typeof yesNoValues)[keyof typeof yesNoValues];
