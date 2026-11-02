export const certificationPurposes = {
  slaughter: { value: 'slaughter', display: 'Slaughter' },
} as const;

export type CertificationPurpose = (typeof certificationPurposes)[keyof typeof certificationPurposes];
