export const SET_BASES = {
  liveAnimals: '/live-animals',
  highRiskPlants: '/high-risk-plants',
} as const;

export type SetBase = (typeof SET_BASES)[keyof typeof SET_BASES];
