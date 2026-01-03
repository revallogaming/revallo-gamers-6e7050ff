-- Fix profiles RLS: change public read policy to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can read public profile data" ON public.profiles;

CREATE POLICY "Anyone can read public profile data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Ensure the policy is PERMISSIVE (default) to allow public reads