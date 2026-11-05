export const importReasons = {
  internalMarket: { value: 'internalMarket', display: 'Internal market' },
  transit: { value: 'transit', display: 'Transit' },
  temporaryAdmissionHorses: { value: 'temporaryAdmissionHorses', display: 'Temporary admission horses' },
} as const;

export type ImportReason = (typeof importReasons)[keyof typeof importReasons];
