

# Module 02: Property Profiles — Implementation Plan

## Overview
Build the customer Property Profile screen and onboarding gate. The database tables (`properties` and `zones`) already exist with correct schemas and RLS policies -- no migrations needed. This is a frontend-focused implementation.

---

## Current State
- `properties` table exists with all required columns and RLS (user owns their rows, admins can read all)
- `zones` table exists with `zip_codes` array and RLS (authenticated can read)
- `src/pages/customer/Property.tsx` is a placeholder
- No property-based onboarding gate exists
- No property data hooks exist

---

## Implementation Steps

### Step 1: Replace Documentation
Replace `docs/modules/02-property-profiles.md` with the uploaded expanded PRD.

### Step 2: Create Property Hook (`src/hooks/useProperty.ts`)
A custom hook that encapsulates all property data logic:
- **Fetch**: Query `properties` where `user_id = auth.uid()`, ordered by `updated_at desc`, limit 1
- **Save**: If existing property ID is loaded, UPDATE; otherwise INSERT with `user_id`
- Uses TanStack Query for caching and loading states
- Returns `{ property, isLoading, save, isSaving }`
- Pets handling: parse comma-separated input into JSON array on save, join back for display

### Step 3: Create Zone Lookup Hook (`src/hooks/useZoneLookup.ts`)
A hook for the zip code coverage indicator:
- Accepts a zip code string
- Only queries when zip is exactly 5 digits
- Debounces input (300ms) to avoid excessive queries
- Queries `zones` table, filtering where `zip_codes` contains the entered zip
- Returns `{ zoneName: string | null, isLoading: boolean, isNotCovered: boolean }`
- Uses Supabase's `.contains()` filter on the `zip_codes` array column

### Step 4: Build Property Form Page (`src/pages/customer/Property.tsx`)
Replace the placeholder with a full form implementation:

**Layout:**
- Single-column, mobile-first
- Header: "Your Home" title + "A few details so we can serve you smoothly." subtitle
- Gated banner (when redirected): "Add your home details to continue." (dismissible)

**Section A -- Address (required):**
- Street Address (text input, required)
- City (text input, required)
- State (text input, default "CA", required)
- Zip Code (numeric input, 5 digits, strips non-digits)
- Zone coverage indicator below zip field:
  - Loading: "Checking coverage..."
  - Covered: "Zone: {name}" (green tint)
  - Not covered: "Not currently serviced in this area" (amber tint)

**Section B -- Access and Logistics (optional):**
- Gate Code (text)
- Access Instructions (textarea)
- Parking Notes (textarea)
- Pets (text input with helper "Example: dog, cat")
- Notes (textarea)

**Save button:**
- Sticky at bottom of viewport
- Disabled until required fields are valid
- Shows loading spinner while saving
- Success: toast "Home details saved"
- Failure: toast with actionable message + inline field errors

**Prefill behavior:**
- On mount, fetch existing property
- If found, prefill all fields
- If not found, empty form with state defaulting to "CA"

**Validation:**
- Inline errors next to fields (not toast-only)
- Required: street_address, city, state, zip_code
- Zip must be exactly 5 digits
- Errors associated via aria-describedby for accessibility

### Step 5: Customer Property Gate (`src/components/CustomerPropertyGate.tsx`)
A wrapper component for customer routes that enforces property onboarding:

- Fetches the user's property count (lightweight query: `.select('id', { count: 'exact', head: true })`)
- If loading: show skeleton/spinner
- If no property AND current path is NOT `/customer/property`: redirect to `/customer/property?gated=1`
- If property exists or already on `/customer/property`: render children
- This avoids redirect loops

### Step 6: Integrate Gate into App Routing (`src/App.tsx`)
Wrap all customer routes (except `/customer/property`) with the property gate:

```text
Customer route group structure:
  ProtectedRoute (requiredRole="customer")
    AppLayout
      /customer/property  --> PropertyPage (no gate)
      CustomerPropertyGate wrapper:
        /customer          --> Dashboard
        /customer/build    --> Build
        /customer/history  --> History
        ... (all other customer routes)
```

The simplest approach: wrap the customer `<Route>` group so that `/customer/property` is outside the gate but all other customer routes go through it.

### Step 7: Add `hasProperty` to AuthContext (optional optimization)
Add a `hasProperty` boolean to AuthContext that gets fetched alongside roles/profile in `fetchUserData()`. This avoids each gated page making its own property-existence check. The gate component can read this from context instead of querying independently.

---

## Files Impact

### New files:
- `src/hooks/useProperty.ts` -- Property CRUD hook
- `src/hooks/useZoneLookup.ts` -- Zone coverage lookup hook  
- `src/components/CustomerPropertyGate.tsx` -- Onboarding gate wrapper

### Modified files:
- `src/pages/customer/Property.tsx` -- Full form replacing placeholder
- `src/App.tsx` -- Wrap customer routes with property gate
- `src/contexts/AuthContext.tsx` -- Add `hasProperty` to context
- `docs/modules/02-property-profiles.md` -- Replace with expanded PRD

### No database changes needed:
- `properties` table already has the correct schema
- `zones` table already has `zip_codes` array
- RLS policies are already correct

---

## Technical Details

### Zone lookup query
```typescript
const { data } = await supabase
  .from('zones')
  .select('name')
  .contains('zip_codes', [zipCode])
  .eq('status', 'active')
  .limit(1)
  .single();
```

### Property fetch query
```typescript
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Pets data transformation
- On load: `(property.pets as string[])?.join(', ')` for display
- On save: `inputValue.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)` as JSON array

### Gate redirect flow
```text
User logs in (customer) --> RootRedirect sends to /customer
  --> CustomerPropertyGate checks property existence
    --> No property? Redirect to /customer/property?gated=1
    --> Has property? Render Dashboard
```

