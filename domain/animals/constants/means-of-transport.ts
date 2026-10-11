export const meansOfTransport = {
  airplane: { value: 'AIRPLANE', display: 'Air' },
  railway: { value: 'RAILWAY', display: 'Rail' },
  roadVehicle: { value: 'ROAD_VEHICLE', display: 'Road' },
  vessel: { value: 'VESSEL', display: 'Sea' },
} as const;

export type MeansOfTransport = (typeof meansOfTransport)[keyof typeof meansOfTransport];

export function requiresTransitedCountries(meansOfTransport: MeansOfTransport): boolean {
  return meansOfTransport.value === 'RAILWAY' || meansOfTransport.value === 'ROAD_VEHICLE';
}
