export const importReasons = {
  internalMarket: { value: 'internalMarket', display: 'Internal market' },
} as const;

export type ImportReason = (typeof importReasons)[keyof typeof importReasons];
