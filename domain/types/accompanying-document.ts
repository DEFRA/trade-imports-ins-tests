import type { DocumentType } from '@domain/constants/document-types';
import type { DateInput } from '@domain/types/date-time-input';

export type AccompanyingDocument = {
  filePath: string;
  documentType?: DocumentType;
  documentReference?: string;
  issueDate?: DateInput;
};
