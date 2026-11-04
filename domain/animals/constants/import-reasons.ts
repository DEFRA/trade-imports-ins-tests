export const importReasons = {
  internalMarket: { value: 'internalMarket', display: 'Internal market' },
  transit: { value: 'transit', display: 'Transit' },
} as const;

export type ImportReason = (typeof importReasons)[keyof typeof importReasons];
