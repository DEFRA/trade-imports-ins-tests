export const certificationPurposes = {
  approvedBodies: 'approvedBodies',
  breedingAndOrProduction: 'breedingAndOrProduction',
  slaughter: 'slaughter',
} as const;

export type CertificationPurpose = (typeof certificationPurposes)[keyof typeof certificationPurposes];
