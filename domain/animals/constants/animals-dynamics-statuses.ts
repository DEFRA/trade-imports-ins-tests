/** defraimp_status option-set codes in PIMS Dynamics. */
export const animalsDynamicsStatuses = {
  submitted: 714100001,
} as const;

export type AnimalsDynamicsStatus = (typeof animalsDynamicsStatuses)[keyof typeof animalsDynamicsStatuses];
