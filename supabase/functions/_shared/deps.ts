/**
 * Shared dependency re-exports for Edge Functions.
 * Pin versions here to prevent drift across 36+ functions.
 */

export { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
