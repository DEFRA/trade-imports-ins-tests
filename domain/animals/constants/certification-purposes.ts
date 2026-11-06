export const certificationPurposes = {
  slaughter: { value: 'slaughter', display: 'Slaughter' },
  registeredEquineAnimal: { value: 'registered-equine-animal', display: 'Registered equine animal' },
  furtherKeeping: { value: 'further-keeping', display: 'Further keeping' },
} as const;

export type CertificationPurpose = (typeof certificationPurposes)[keyof typeof certificationPurposes];
