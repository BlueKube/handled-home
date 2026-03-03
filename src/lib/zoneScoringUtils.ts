/**
 * Zone Builder Scoring Utilities
 * Pure functions for cell scoring, seed selection, and zone metrics.
 */
import { h3GridDistance, h3CellAreaKm2, h3ToLatLng } from './h3Utils';

// ─── Scoring Weights ───────────────────────────────────────
/** Weights for computing cell seed score */
export const SEED_WEIGHTS = {
  demand: 0.55,
  supply: 0.35,
  walkability: 0.10,
} as const;

// ─── Cell Scoring ──────────────────────────────────────────

export interface CellData {
  h3Index: string;
  demandMinutesWeek: number;
  supplyMinutesWeek: number;
  customerCount: number;
  providerCount: number;
  categoryDemand: Record<string, number>;
  categorySupply: Record<string, number>;
}

/**
 * Normalize a value to 0-1 range given min/max across all cells.
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Score a cell's demand signal (0-1).
 * Based on demand_minutes_week relative to population.
 */
export function scoreCellDemand(cell: CellData, allCells: CellData[]): number {
  const demands = allCells.map((c) => c.demandMinutesWeek);
  return normalize(cell.demandMinutesWeek, Math.min(...demands), Math.max(...demands));
}

/**
 * Score a cell's supply signal (0-1).
 * Based on supply_minutes_week (provider capacity).
 */
export function scoreCellSupply(cell: CellData, allCells: CellData[]): number {
  const supplies = allCells.map((c) => c.supplyMinutesWeek);
  return normalize(cell.supplyMinutesWeek, Math.min(...supplies), Math.max(...supplies));
}

/**
 * Walkability proxy (0-1).
 * Density of customers + providers in the cell as a fraction of max density.
 */
export function scoreCellWalkability(cell: CellData, allCells: CellData[]): number {
  const densities = allCells.map((c) => c.customerCount + c.providerCount);
  const cellDensity = cell.customerCount + cell.providerCount;
  return normalize(cellDensity, Math.min(...densities), Math.max(...densities));
}

/**
 * Compute the composite seed score for a cell.
 * SeedScore = 0.55·Demand + 0.35·Supply + 0.10·Walkability
 */
export function computeSeedScore(cell: CellData, allCells: CellData[]): number {
  const d = scoreCellDemand(cell, allCells);
  const s = scoreCellSupply(cell, allCells);
  const w = scoreCellWalkability(cell, allCells);
  return SEED_WEIGHTS.demand * d + SEED_WEIGHTS.supply * s + SEED_WEIGHTS.walkability * w;
}

// ─── Zone Metrics ──────────────────────────────────────────

export interface ZoneMetrics {
  /** Total demand minutes per week across all cells */
  demandMinWeek: number;
  /** Total supply minutes per week across all cells */
  supplyMinWeek: number;
  /** Supply/Demand ratio (higher = more covered) */
  sdRatio: number;
  /** Average customers per km² */
  density: number;
  /** Compactness: ratio of actual area to convex hull area (0-1, 1 = perfect) */
  compactness: number;
  /** Max grid distance between any two cells in the zone */
  maxSpreadCells: number;
  /** Estimated max drive time between extremes (minutes) */
  driveBurdenProxy: number;
  /** Number of cells */
  cellCount: number;
  /** Total area in km² */
  totalAreaKm2: number;
}

/**
 * Compute aggregate metrics for a zone from its constituent cells.
 */
export function computeZoneMetrics(
  cells: CellData[],
  estimateDriveMinutesFn: (a: string, b: string) => number
): ZoneMetrics {
  if (cells.length === 0) {
    return {
      demandMinWeek: 0,
      supplyMinWeek: 0,
      sdRatio: 0,
      density: 0,
      compactness: 0,
      maxSpreadCells: 0,
      driveBurdenProxy: 0,
      cellCount: 0,
      totalAreaKm2: 0,
    };
  }

  const demandMinWeek = cells.reduce((sum, c) => sum + c.demandMinutesWeek, 0);
  const supplyMinWeek = cells.reduce((sum, c) => sum + c.supplyMinutesWeek, 0);
  const sdRatio = demandMinWeek > 0 ? supplyMinWeek / demandMinWeek : 0;

  const totalCustomers = cells.reduce((sum, c) => sum + c.customerCount, 0);
  const totalAreaKm2 = cells.reduce((sum, c) => sum + h3CellAreaKm2(c.h3Index), 0);
  const density = totalAreaKm2 > 0 ? totalCustomers / totalAreaKm2 : 0;

  // Compactness: cells / filled disk of same radius
  // Approximate: actual cells / gridDisk(centroid, maxRadius) count
  let maxSpreadCells = 0;
  let maxDriveBurden = 0;

  // Find the two most distant cells
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const dist = h3GridDistance(cells[i].h3Index, cells[j].h3Index);
      if (dist > maxSpreadCells) {
        maxSpreadCells = dist;
      }
    }
  }

  // Drive burden: estimate drive time between the two most distant cells
  if (cells.length >= 2) {
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const drive = estimateDriveMinutesFn(cells[i].h3Index, cells[j].h3Index);
        if (drive > maxDriveBurden) {
          maxDriveBurden = drive;
        }
      }
    }
  }

  // Compactness approximation: cellCount / ideal disk area
  // An ideal disk of radius R has ~3R²+3R+1 cells
  const R = Math.ceil(maxSpreadCells / 2);
  const idealCellCount = R > 0 ? 3 * R * R + 3 * R + 1 : 1;
  const compactness = Math.min(1, cells.length / idealCellCount);

  return {
    demandMinWeek,
    supplyMinWeek,
    sdRatio: Math.round(sdRatio * 100) / 100,
    density: Math.round(density * 100) / 100,
    compactness: Math.round(compactness * 100) / 100,
    maxSpreadCells,
    driveBurdenProxy: Math.round(maxDriveBurden * 10) / 10,
    cellCount: cells.length,
    totalAreaKm2: Math.round(totalAreaKm2 * 100) / 100,
  };
}

// ─── Feasibility Checks ────────────────────────────────────

export type ZoneWarning = 'too_sparse' | 'overloaded' | 'category_mismatch' | 'too_large';

export interface FeasibilityConfig {
  /** Minimum density (customers/km²) */
  minDensity: number;
  /** Maximum S/D ratio before "overloaded" */
  maxSdRatio: number;
  /** Maximum spread in grid cells */
  maxSpreadCells: number;
  /** Minimum cell count */
  minCellCount: number;
}

export const DEFAULT_FEASIBILITY: FeasibilityConfig = {
  minDensity: 0.5,
  maxSdRatio: 2.0,
  maxSpreadCells: 15,
  minCellCount: 3,
};

/**
 * Check feasibility constraints and return warnings.
 */
export function checkFeasibility(
  metrics: ZoneMetrics,
  config: FeasibilityConfig = DEFAULT_FEASIBILITY
): ZoneWarning[] {
  const warnings: ZoneWarning[] = [];

  if (metrics.density < config.minDensity || metrics.cellCount < config.minCellCount) {
    warnings.push('too_sparse');
  }
  if (metrics.sdRatio > config.maxSdRatio) {
    warnings.push('overloaded');
  }
  if (metrics.maxSpreadCells > config.maxSpreadCells) {
    warnings.push('too_large');
  }

  return warnings;
}

// ─── Seed Selection ────────────────────────────────────────

export type SeedStrategy = 'auto' | 'demand_first' | 'provider_first';

/**
 * Select seed cells for zone generation.
 * @param cells All cells with data
 * @param targetZoneCount Estimated number of zones to create
 * @param strategy Seed selection strategy
 * @returns Array of seed cell H3 indices
 */
export function selectSeeds(
  cells: CellData[],
  targetZoneCount: number,
  strategy: SeedStrategy = 'auto'
): string[] {
  if (cells.length === 0 || targetZoneCount <= 0) return [];

  let scored: Array<{ h3Index: string; score: number }>;

  switch (strategy) {
    case 'demand_first':
      scored = cells.map((c) => ({
        h3Index: c.h3Index,
        score: scoreCellDemand(c, cells),
      }));
      break;
    case 'provider_first':
      scored = cells.map((c) => ({
        h3Index: c.h3Index,
        score: scoreCellSupply(c, cells),
      }));
      break;
    case 'auto':
    default:
      scored = cells.map((c) => ({
        h3Index: c.h3Index,
        score: computeSeedScore(c, cells),
      }));
      break;
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Select top-N seeds, ensuring minimum spacing (at least 3 grid cells apart)
  const seeds: string[] = [];
  const MIN_SEED_SPACING = 3;

  for (const candidate of scored) {
    if (seeds.length >= targetZoneCount) break;

    const tooClose = seeds.some((existing) => {
      const dist = h3GridDistance(candidate.h3Index, existing);
      return dist >= 0 && dist < MIN_SEED_SPACING;
    });

    if (!tooClose) {
      seeds.push(candidate.h3Index);
    }
  }

  return seeds;
}
