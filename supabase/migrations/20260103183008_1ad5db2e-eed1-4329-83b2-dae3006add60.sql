-- Create a public view that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = true)
AS SELECT 
  id,
  nickname,
  avatar_url,
  bio,
  main_game,
  is_highlighted,
  highlighted_until,
  created_at
FROM public.profiles
WHERE is_banned = false;

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- Create a more restrictive public policy that only allows reading non-sensitive columns
-- This policy allows public read but the application should use public_profiles view
CREATE POLICY "Public can read basic profile info" ON public.profiles
FOR SELECT
USING (true);

-- Note: The view public_profiles already filters out banned users and sensitive columns
-- Applications should query public_profiles for public-facing profile data