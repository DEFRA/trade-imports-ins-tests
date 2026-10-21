import { DECIMAL_BYTES_PER_MB } from '@utils/synthetic-file-writer';

export const MAX_FILE_SIZE_BYTES = 50 * DECIMAL_BYTES_PER_MB;

/**
 * Comfortably over the limit, so the rejection fires whether the browser's own check catches the
 * file or the upload service refuses it on receipt.
 */
export const ABOVE_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES + 200_000;

export const OVERSIZE_FILE_MESSAGE = 'The selected file must be smaller than 50MB';
