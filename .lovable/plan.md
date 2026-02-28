

# Sprint 2H-E Remediation Plan (E-F3 + E-F7)

## Step 1: Add cron_run_log to run-scheduled-jobs (E-F3)

**File**: `supabase/functions/run-scheduled-jobs/index.ts`

- At start: call `start_cron_run` RPC with `function_name: 'run-scheduled-jobs'` and idempotency key formatted as `daily:YYYY-MM-DD` (or `weekly:YYYY-MM-DD` for Monday jobs)
- Each sub-job (byoc_lifecycle, compute_byoc_bonuses, provider_weekly_rollups) gets its own `start_cron_run` / `finish_cron_run` entry with key like `byoc_lifecycle:2026-02-28`
- Orchestrator-level `finish_cron_run` at the end with status `success|partial_failure|failed` and `result_summary` containing per-sub-job outcomes (ran, failed, counts)
- Outer catch calls `finish_cron_run` with `failed` status + error message

## Step 2: DispatcherActionsDialog defaultAction prop (E-F7)

**File**: `src/components/admin/DispatcherActionsDialog.tsx`

- Add `defaultAction?: ActionType` to props interface
- Initialize state: `useState<ActionType>(defaultAction ?? "note")`
- Add `useEffect` that resets `action` to `defaultAction ?? "note"` when `defaultAction` or `jobId` changes (covers both "E vs N shortcut" and "reset on new job" requirements)
- Also reset `note` text when `jobId` changes

**File**: `src/pages/admin/DispatcherQueues.tsx`

- Add `defaultAction` state: `useState<ActionType | undefined>(undefined)`
- `E` shortcut: sets `defaultAction: "create_ticket"` + `actionJobId`
- `N` shortcut: sets `defaultAction: "note"` + `actionJobId`
- `A` shortcut: sets `defaultAction: undefined` (user picks)
- Pass `defaultAction` to `DispatcherActionsDialog`
- On dialog close: reset both `actionJobId` and `defaultAction`
- Keyboard handler already guards against input/textarea/select focus (lines 200-204) — confirmed present

## Step 3: pg_cron/pg_net verification

- Use read-query tool to check if extensions are enabled
- Only create enable-extension migration if needed (likely already available on Lovable Cloud)

