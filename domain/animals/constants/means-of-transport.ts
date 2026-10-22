export const meansOfTransport = {
  airplane: { value: 'AIRPLANE', display: 'Airplane' },
  railway: { value: 'RAILWAY', display: 'Railway' },
  roadVehicle: { value: 'ROAD_VEHICLE', display: 'Road Vehicle' },
  vessel: { value: 'VESSEL', display: 'Vessel' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];
