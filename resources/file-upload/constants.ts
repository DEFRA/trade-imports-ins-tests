import { DECIMAL_BYTES_PER_MB } from '@utils/synthetic-file-writer';

export const MAX_FILE_SIZE_BYTES = 50 * DECIMAL_BYTES_PER_MB;

export const ABOVE_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES + 200_000;

export const OVERSIZE_FILE_MESSAGE = 'The selected file must be smaller than 50MB';

export const DOCUMENT_ISSUE_DATE = '03/01/2026';
