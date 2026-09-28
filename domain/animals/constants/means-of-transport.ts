export const meansOfTransport = {
  airplane: { value: 'AIRPLANE', display: 'Airplane' },
  railway: { value: 'RAILWAY', display: 'Railway' },
  roadVehicle: { value: 'ROAD_VEHICLE', display: 'Road vehicle' },
  vessel: { value: 'VESSEL', display: 'Vessel' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];

export function requiresTransitedCountries(meansOfTransport: MeansOfTransport): boolean {
  return meansOfTransport.value === 'RAILWAY' || meansOfTransport.value === 'ROAD_VEHICLE';
}
