/**
 * Drive Time Proxy
 * Mode 1: Haversine distance × city multiplier (v1, no API needed).
 * Mode 2: Interface stub for future travel-time API integration.
 */
import { h3ToLatLng } from './h3Utils';

/** Default city road multiplier (accounts for non-straight-line roads) */
const DEFAULT_CITY_MULTIPLIER = 1.4;

/** Average driving speed in km/h for suburban areas */
const AVG_DRIVING_SPEED_KMH = 35;

/**
 * Haversine distance between two lat/lng points in km.
 */
function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Mode 1: Estimate drive time between two H3 cells using haversine + city multiplier.
 * Returns estimated minutes.
 */
export function estimateDriveMinutes(
  cellA: string,
  cellB: string,
  cityMultiplier = DEFAULT_CITY_MULTIPLIER,
  avgSpeedKmh = AVG_DRIVING_SPEED_KMH
): number {
  const [latA, lngA] = h3ToLatLng(cellA);
  const [latB, lngB] = h3ToLatLng(cellB);

  const straightLineKm = haversineDistanceKm(latA, lngA, latB, lngB);
  const estimatedRoadKm = straightLineKm * cityMultiplier;
  const minutes = (estimatedRoadKm / avgSpeedKmh) * 60;

  return Math.round(minutes * 10) / 10;
}

/**
 * Estimate drive time between two lat/lng points (not H3 cells).
 */
export function estimateDriveMinutesLatLng(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  cityMultiplier = DEFAULT_CITY_MULTIPLIER,
  avgSpeedKmh = AVG_DRIVING_SPEED_KMH
): number {
  const straightLineKm = haversineDistanceKm(lat1, lng1, lat2, lng2);
  const estimatedRoadKm = straightLineKm * cityMultiplier;
  const minutes = (estimatedRoadKm / avgSpeedKmh) * 60;

  return Math.round(minutes * 10) / 10;
}

// ─── Mode 2: Future Travel-Time API Stub ───────────────────

/**
 * Interface for a future travel-time API integration.
 * When implemented, replace estimateDriveMinutes with this.
 */
export interface TravelTimeProvider {
  /**
   * Get actual drive time between two points.
   * @returns Drive time in minutes, or null if unavailable.
   */
  getDriveMinutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<number | null>;
}

/**
 * Stub implementation that falls back to Mode 1.
 * Replace with real API (e.g., Mapbox Directions, Google Distance Matrix) in future.
 */
export const fallbackTravelTimeProvider: TravelTimeProvider = {
  async getDriveMinutes(origin, destination) {
    return estimateDriveMinutesLatLng(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );
  },
};
