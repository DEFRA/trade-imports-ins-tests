export const importReasons = {
  internalMarket: 'internalMarket',
  reEntry: 'reEntry',
} as const;

export type ImportReason = (typeof importReasons)[keyof typeof importReasons];
