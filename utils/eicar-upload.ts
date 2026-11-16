export type InMemoryFile = { name: string; mimeType: string; buffer: Buffer };

/**
 * Returns the standard EICAR anti-virus test file as an in-memory PDF upload named `eicar-virus-file.pdf`.
 *
 * @see https://www.eicar.org/download-anti-malware-testfile/
 */
export function eicarPdfUpload(): InMemoryFile {
  const EICAR_STANDARD_FILE_B64 = 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=';
  return {
    name: 'eicar-virus-file.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(EICAR_STANDARD_FILE_B64, 'base64'),
  };
}
