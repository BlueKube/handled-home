# Batch 6: Admin ProviderLeads Page + Route + Nav

## Phase
Phase 3 — Admin Provider Lead Pipeline

## Review: Quality

## Size: Medium

## What
Create the admin provider leads page with a filterable table, status management, and navigation entry.

## Requirements

### Page: src/pages/admin/ProviderLeads.tsx
1. Table showing all provider_leads: email, zip_code, categories, source, status, created_at
2. Filters: status dropdown, ZIP text filter, category filter
3. Status update: click to change status (new→contacted→applied→declined)
4. Sort by created_at descending (newest first)
5. Loading and empty states

### Route
- `/admin/provider-leads` in App.tsx

### Navigation
- Entry under Growth section in AdminShell.tsx with Mail icon

## Acceptance Criteria
- [ ] Page renders with provider leads table
- [ ] Filters work for status, ZIP, category
- [ ] Status can be updated inline
- [ ] Route registered and accessible
- [ ] Nav entry visible under Growth
- [ ] Uses `as any` for Supabase types
- [ ] Loading skeleton while data loads

## Files Changed
- `src/pages/admin/ProviderLeads.tsx` (new)
- `src/App.tsx` (edit — add route)
- `src/components/admin/AdminShell.tsx` (edit — add nav item)
