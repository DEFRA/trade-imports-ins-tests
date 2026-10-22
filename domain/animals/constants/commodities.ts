export const commodities = {
  cow: { value: 'Cow', display: 'Cow' },
} as const;

export type Commodity = (typeof commodities)[keyof typeof commodities];
