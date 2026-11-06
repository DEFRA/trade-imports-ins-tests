export const LIVE_ANIMALS = { value: 'live-animals', label: 'Live animals', service: 'animals' } as const;
export const PLANTS_FOR_PLANTING = { value: 'plants-for-planting', label: 'Plants for planting', service: 'plants' } as const;
export const POTATOES = { value: 'potatoes', label: 'Potatoes (seed and ware)', service: 'plants' } as const;
export const WOOD_PRODUCTS = { value: 'wood-products', label: 'Wood products', service: 'plants' } as const;

export const NOTIFICATION_TYPE_OPTIONS = [LIVE_ANIMALS, PLANTS_FOR_PLANTING, POTATOES, WOOD_PRODUCTS] as const;

export type NotificationTypeOption = (typeof NOTIFICATION_TYPE_OPTIONS)[number];

export const PLANTS_OPTIONS = [PLANTS_FOR_PLANTING, POTATOES, WOOD_PRODUCTS] as const;

export const NOTIFICATION_TYPE_REQUIRED_ERROR = 'Select what you are importing';
