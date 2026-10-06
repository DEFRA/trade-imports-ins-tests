import type { ObjectId } from 'mongodb';

export type AccompanyingDocumentModel = {
  _id: ObjectId;
  version: number;
  notificationReferenceNumber: string;
  uploadId: string;
  correlationId: string;
  documentType: string;
  documentReference: string;
  /** A calendar date, stored as a `YYYY-MM-DD` string. */
  dateOfIssue: string;
  scanStatus: string;
  files: Array<{
    filename: string;
    contentType: string;
    contentLength: number;
    s3Key: string;
    s3Bucket: string;
    fileStatus: string;
    checksumSha256: string;
    detectedContentType: string;
  }>;
  created: Date;
  updated: Date;
  _class: string;
};
