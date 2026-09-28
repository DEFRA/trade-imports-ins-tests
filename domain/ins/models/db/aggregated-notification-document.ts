export type AggregatedNotificationDocument = {
  _id: string;
  aggregateVersion: number;
  referenceNumber?: string;
  status?: string;
  originCountry?: string;
  commodity?: string;
  arrivalDate?: Date;
  lastUpdated?: Date;
};
