
-- Fix 1 & 4: Drop the trigger and function (eliminates privilege escalation entirely)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fix 3: Make full_name NOT NULL with default
UPDATE public.profiles SET full_name = '' WHERE full_name IS NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;

-- Fix 5: Explicit DELETE deny on profiles
CREATE POLICY "No one can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (false);
