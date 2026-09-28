export const documentTypes = {
  itahc: 'ITAHC',
  veterinaryHealthCertificate: 'VETERINARY_HEALTH_CERTIFICATE',
} as const;

export type DocumentType = (typeof documentTypes)[keyof typeof documentTypes];
