export const meansOfTransport = {
  airplane: { value: 'AIRPLANE', display: 'Air' },
  railway: { value: 'RAILWAY', display: 'Rail' },
  roadVehicle: { value: 'ROAD_VEHICLE', display: 'Road' },
  vessel: { value: 'VESSEL', display: 'Sea' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];

export const MEANS_OF_TRANSPORT_SELECT_TEXT = 'Select one';

export const MEANS_OF_TRANSPORT_REQUIRED_ERROR = 'Select a means of transport to the port of entry';
