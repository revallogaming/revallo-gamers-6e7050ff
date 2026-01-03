-- Drop the overly permissive public policy on profiles
DROP POLICY IF EXISTS "Anyone can read public profile data" ON public.profiles;

-- Recreate public_profiles view with security_invoker = false so it bypasses RLS
-- This view only exposes safe fields (no ban info, no sensitive timestamps)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = false)
AS
SELECT 
  id,
  nickname,
  avatar_url,
  bio,
  main_game,
  is_highlighted,
  highlighted_until,
  created_at
FROM public.profiles;

-- Grant SELECT access to the view for all users
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- For tournament_participants, the current RLS already restricts email access to:
-- 1. The participant themselves (player_id = auth.uid())
-- 2. The tournament organizer (for legitimate communication)
-- The public_tournament_participants view already excludes participant_email
-- The get_tournament_participants RPC also excludes email
-- This is secure - organizers need email access for legitimate tournament management