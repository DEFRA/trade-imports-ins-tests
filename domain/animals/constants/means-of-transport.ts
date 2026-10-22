export const meansOfTransport = {
  airplane: { value: 'AIRPLANE', display: 'Air' },
  railway: { value: 'RAILWAY', display: 'Rail' },
  roadVehicle: { value: 'ROAD_VEHICLE', display: 'Road' },
  vessel: { value: 'VESSEL', display: 'Sea' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];
