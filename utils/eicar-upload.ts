export type InMemoryFile = { name: string; mimeType: string; buffer: Buffer };

const EICAR_STANDARD_FILE_B64 = 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=';

/**
 * Returns the standard EICAR anti-virus test file as an in-memory PDF upload named `eicar-virus-file.pdf`,
 * for `locator.setInputFiles`. The bytes are never written to disk.
 *
 * @see https://www.eicar.org/download-anti-malware-testfile/
 */
export function eicarPdfUpload(): InMemoryFile {
  return {
    name: 'eicar-virus-file.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(EICAR_STANDARD_FILE_B64, 'base64'),
  };
}
