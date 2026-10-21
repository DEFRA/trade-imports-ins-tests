export const transporters = {
  garciaLivestockTransport: { value: 'garcia-livestock-transport', display: 'García Livestock Transport SL' },
} as const;

export type Transporter = (typeof transporters)[keyof typeof transporters];
