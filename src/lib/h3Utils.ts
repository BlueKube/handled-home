/**
 * H3 Hexagonal Geospatial Indexing Utilities
 * Wraps h3-js for zone builder operations.
 */
import {
  latLngToCell,
  cellToLatLng,
  cellToBoundary,
  gridDisk,
  gridDistance,
  cellArea,
  UNITS,
  isPentagon,
  isValidCell,
  getResolution,
  gridRingUnsafe,
  cellToParent,
  cellToChildren,
} from 'h3-js';

/** Default H3 resolution for zone building (~5.16 km² per hex, ~36 hexes per suburban zone) */
export const DEFAULT_H3_RESOLUTION = 7;

/**
 * Convert lat/lng to H3 cell index at given resolution.
 */
export function latLngToH3(lat: number, lng: number, resolution = DEFAULT_H3_RESOLUTION): string {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Get the center lat/lng of an H3 cell.
 * Returns [lat, lng].
 */
export function h3ToLatLng(h3Index: string): [number, number] {
  return cellToLatLng(h3Index) as [number, number];
}

/**
 * Get the boundary polygon vertices of an H3 cell.
 * Returns array of [lat, lng] pairs.
 */
export function h3ToBoundary(h3Index: string): [number, number][] {
  return cellToBoundary(h3Index) as [number, number][];
}

/**
 * Get all cells within k rings (inclusive) of the origin cell.
 */
export function h3GridDisk(h3Index: string, k: number): string[] {
  return gridDisk(h3Index, k);
}

/**
 * Get the ring at exactly distance k from origin (not filled).
 */
export function h3GridRing(h3Index: string, k: number): string[] {
  return gridRingUnsafe(h3Index, k);
}

/**
 * Get the grid distance between two H3 cells.
 * Returns -1 if cells are not comparable (different resolutions or disconnected).
 */
export function h3GridDistance(a: string, b: string): number {
  try {
    return gridDistance(a, b);
  } catch {
    return -1;
  }
}

/**
 * Get the area of an H3 cell in km².
 */
export function h3CellAreaKm2(h3Index: string): number {
  return cellArea(h3Index, UNITS.km2);
}

/**
 * Check if an H3 index is valid.
 */
export function isValidH3(h3Index: string): boolean {
  return isValidCell(h3Index);
}

/**
 * Check if an H3 cell is a pentagon (edge case in H3 grid).
 */
export function isH3Pentagon(h3Index: string): boolean {
  return isPentagon(h3Index);
}

/**
 * Get the resolution of an H3 cell.
 */
export function h3GetResolution(h3Index: string): number {
  return getResolution(h3Index);
}

/**
 * Get parent cell at a coarser resolution.
 */
export function h3ToParent(h3Index: string, parentResolution: number): string {
  return cellToParent(h3Index, parentResolution);
}

/**
 * Get children cells at a finer resolution.
 */
export function h3ToChildren(h3Index: string, childResolution: number): string[] {
  return cellToChildren(h3Index, childResolution);
}

/**
 * Merge an array of H3 cell boundaries into GeoJSON-compatible polygons.
 * Each cell becomes a polygon feature. Useful for Mapbox rendering.
 */
export function h3CellsToGeoJsonFeatures(
  h3Indices: string[],
  properties: Record<string, unknown> = {}
): GeoJSON.Feature[] {
  return h3Indices.map((h3Index) => {
    const boundary = h3ToBoundary(h3Index);
    // H3 returns [lat, lng], GeoJSON needs [lng, lat]
    const coordinates = boundary.map(([lat, lng]) => [lng, lat]);
    // Close the polygon
    coordinates.push(coordinates[0]);

    return {
      type: 'Feature' as const,
      properties: { h3Index, ...properties },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates],
      },
    };
  });
}

/**
 * Get all immediate neighbors of an H3 cell (k=1 ring, excluding self).
 */
export function h3Neighbors(h3Index: string): string[] {
  return h3GridRing(h3Index, 1);
}
