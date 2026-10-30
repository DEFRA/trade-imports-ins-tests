export const documentTypes = {
  itahc: 'ITAHC',
  veterinaryHealthCertificate: 'VETERINARY_HEALTH_CERTIFICATE',
} as const;

export type DocumentType = (typeof documentTypes)[keyof typeof documentTypes];

export const DOCUMENT_TYPE_SELECT_TEXT = 'Select one';

export const OFFERED_DOCUMENT_TYPE_LABELS = [
  'ITAHC (Intra Trade Animal Health Certificate)',
  'Other veterinary certificate / veterinary declaration',
  'Self-declaration',
  'Journey log',
  'Import permit / authorisation',
  'CITES permit/certificate',
  'Air waybill',
  'Sea waybill',
  'Rail waybill',
  'Bill of lading',
  'Commercial invoice',
  'Packing list / species list',
  'Other supporting documents',
];
