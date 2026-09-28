import type { DocumentType } from '@domain/animals/constants/document-types';
import type { DateInput } from '@domain/shared/types/date-time-input';

export type AccompanyingDocument = {
  filePath: string;
  documentType?: DocumentType;
  documentReference?: string;
  issueDate?: DateInput;
};
