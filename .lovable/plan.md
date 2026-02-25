

# Sprint 6: Route Optimization (2B-02) — COMPLETED

## What was built

### Edge Function: `optimize-routes`
- Accepts `provider_org_id` + `date`
- Queries active jobs for that provider+date
- Joins to `properties` for lat/lng/geohash
- Runs nearest-neighbor heuristic (Haversine distance when lat/lng available, geohash prefix distance as fallback)
- Writes computed `route_order` back to each job
- Logs run to `cron_run_log` with success/failure tracking
- CORS headers on all responses (success + error paths)

### RPC: `reorder_provider_route`
- SECURITY DEFINER — validates caller is a provider member
- Accepts `p_date` + `p_job_orders` (jsonb array of {job_id, route_order})
- Only updates jobs belonging to the caller's org on the given date
- Audit logs each reorder in `job_events` as `ROUTE_REORDERED`
- Returns `{status, updated_count}`

### Provider UI (`/provider/jobs`)
- Today's jobs sorted by `route_order` (optimized order), then `created_at` fallback
- "Next" badge on first unstarted job
- "Optimize Route" button triggers edge function for today
- Up/down arrow controls for manual reorder (saves via RPC immediately)
- Toast feedback on optimize/reorder success/failure

### Hook: `useRouteOptimization`
- `useOptimizeRoute()` — invokes edge function, invalidates provider_jobs cache
- `useReorderRoute()` — calls RPC, invalidates cache

## What was NOT built (per spec — deferred to V2/V3)
- Traffic/time-window optimization
- Full VRP solver
- Map view
- Re-optimization after route starts
- Admin route management UI (admin can trigger via edge function directly)
