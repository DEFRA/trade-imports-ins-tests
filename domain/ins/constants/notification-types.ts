export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'live-animals', label: 'Live animals', service: 'animals' },
  { value: 'germinal-products', label: 'Germinal products (semen, ova, embryos)', service: 'animals' },
  { value: 'plants-for-planting', label: 'Plants for planting', service: 'plants' },
  { value: 'potatoes', label: 'Potatoes (seed and ware)', service: 'plants' },
  { value: 'wood-products', label: 'Wood products', service: 'plants' },
] as const;

export type NotificationTypeOption = (typeof NOTIFICATION_TYPE_OPTIONS)[number];

export const [LIVE_ANIMALS, GERMINAL_PRODUCTS] = NOTIFICATION_TYPE_OPTIONS;
export const PLANTS_OPTIONS = NOTIFICATION_TYPE_OPTIONS.filter((option) => option.service === 'plants');
