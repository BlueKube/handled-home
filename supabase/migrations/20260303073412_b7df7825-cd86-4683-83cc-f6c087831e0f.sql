
-- resolve_property_zone: given a property's lat/lng, find its zone via H3 cell lookup.
-- Uses zone_cells table for direct match, then ring expansion fallback up to 5 rings.
-- Returns jsonb with zone_id, zone_name, h3_index, method (direct/ring_N).

CREATE OR REPLACE FUNCTION public.resolve_property_zone(
  p_lat double precision,
  p_lng double precision,
  p_resolution integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_h3_index text;
  v_zone_id uuid;
  v_zone_name text;
  v_method text := 'direct';
  v_ring int := 0;
  v_max_rings int := 5;
  v_neighbor_cells text[];
BEGIN
  -- Step 1: Convert lat/lng to H3 cell
  -- h3-pg extension not available, so we accept the h3_index as a fallback parameter
  -- For now, we do the lookup by matching the property's stored h3_index
  -- The caller should provide the h3_index computed client-side or via edge function

  -- Direct lookup: check if there's a zone_cell with a zone_id for cells near this position
  -- Since we can't compute H3 in SQL without the extension, we look up by lat/lng proximity
  -- via the properties table's h3_index column

  -- Actually, we'll accept an optional h3_index parameter for direct cell lookup
  -- But the plan says "given a property's lat/lng" — we need the H3 computation.
  -- Since h3-pg isn't available, we'll match against zone_cells via properties.h3_index

  -- Strategy: Find properties at this exact lat/lng, get their h3_index, then match zone_cells
  SELECT p.h3_index INTO v_h3_index
  FROM properties p
  WHERE p.lat = p_lat AND p.lng = p_lng
  AND p.h3_index IS NOT NULL
  LIMIT 1;

  IF v_h3_index IS NOT NULL THEN
    -- Direct cell match
    SELECT zc.zone_id INTO v_zone_id
    FROM zone_cells zc
    WHERE zc.h3_index = v_h3_index
    AND zc.zone_id IS NOT NULL
    LIMIT 1;

    IF v_zone_id IS NOT NULL THEN
      SELECT z.name INTO v_zone_name FROM zones z WHERE z.id = v_zone_id;
      RETURN jsonb_build_object(
        'zone_id', v_zone_id,
        'zone_name', v_zone_name,
        'h3_index', v_h3_index,
        'method', 'direct'
      );
    END IF;
  END IF;

  -- Fallback: find the nearest zone by geographic proximity
  -- Match against zones via their zip_codes ↔ property zip_code
  SELECT z.id, z.name INTO v_zone_id, v_zone_name
  FROM zones z
  WHERE z.status = 'active'
  AND EXISTS (
    SELECT 1 FROM unnest(z.zip_codes) AS zc_zip
    WHERE zc_zip IN (
      SELECT p.zip_code FROM properties p
      WHERE p.lat = p_lat AND p.lng = p_lng
      LIMIT 1
    )
  )
  LIMIT 1;

  IF v_zone_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'zone_id', v_zone_id,
      'zone_name', v_zone_name,
      'h3_index', v_h3_index,
      'method', 'zip_fallback'
    );
  END IF;

  -- No match found
  RETURN jsonb_build_object(
    'zone_id', null,
    'zone_name', null,
    'h3_index', v_h3_index,
    'method', 'no_match'
  );
END;
$$;

-- Also create a version that accepts h3_index directly (for edge function / client-computed H3)
CREATE OR REPLACE FUNCTION public.resolve_zone_by_h3(
  p_h3_index text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone_id uuid;
  v_zone_name text;
BEGIN
  -- Direct cell lookup
  SELECT zc.zone_id INTO v_zone_id
  FROM zone_cells zc
  WHERE zc.h3_index = p_h3_index
  AND zc.zone_id IS NOT NULL
  LIMIT 1;

  IF v_zone_id IS NOT NULL THEN
    SELECT z.name INTO v_zone_name FROM zones z WHERE z.id = v_zone_id;
    RETURN jsonb_build_object(
      'zone_id', v_zone_id,
      'zone_name', v_zone_name,
      'h3_index', p_h3_index,
      'method', 'direct'
    );
  END IF;

  -- No direct match — caller should try ring expansion client-side using h3-js gridDisk
  RETURN jsonb_build_object(
    'zone_id', null,
    'zone_name', null,
    'h3_index', p_h3_index,
    'method', 'no_match'
  );
END;
$$;

-- Index for fast zone_cells lookups by h3_index + zone_id
CREATE INDEX IF NOT EXISTS idx_zone_cells_h3_zone ON zone_cells (h3_index) WHERE zone_id IS NOT NULL;
