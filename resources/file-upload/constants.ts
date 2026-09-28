import { DECIMAL_BYTES_PER_MB } from '@utils/synthetic-file-writer';

export const MAX_FILE_SIZE_BYTES = 10 * DECIMAL_BYTES_PER_MB;

/**
 * Above the Hapi route payload cap (the file limit plus 1024 B of multipart headroom), so the
 * oversize rejection fires whether the browser check or the server catches it.
 */
export const ABOVE_PAYLOAD_CAP_BYTES = MAX_FILE_SIZE_BYTES + 200_000;

export const OVERSIZE_FILE_MESSAGE = 'The selected file must be smaller than 10MB';
