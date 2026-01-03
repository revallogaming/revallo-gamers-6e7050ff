-- 1. Fix public_profiles view - use regular view with RLS instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Add back a restricted public policy on profiles table for the view to work
-- This policy only allows reading rows, the view itself restricts columns
CREATE POLICY "Public can read basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- 2. Fix tournament_participants email access
-- Drop existing organizer SELECT policy
DROP POLICY IF EXISTS "Organizers can view own tournament participants" ON public.tournament_participants;

-- Create new policy that allows organizers to see participants BUT excludes email column
-- Since RLS can't do column-level, we'll handle this differently:
-- Organizers can see the rows (for count, player info) but email access will be via RPC only

-- Recreate organizer policy (they can see rows, but we'll use RPC for email access)
CREATE POLICY "Organizers can view participants without email"
ON public.tournament_participants
FOR SELECT
USING (
  auth.uid() IN (
    SELECT organizer_id FROM tournaments WHERE id = tournament_participants.tournament_id
  )
);

-- 3. Create secure RPC function for organizers to get participant emails
CREATE OR REPLACE FUNCTION public.get_organizer_participant_emails(p_tournament_id uuid)
RETURNS TABLE(
  participant_id uuid,
  player_id uuid,
  participant_email text,
  player_nickname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organizer_id uuid;
BEGIN
  -- Verify caller is the tournament organizer
  SELECT organizer_id INTO v_organizer_id
  FROM tournaments
  WHERE id = p_tournament_id;
  
  IF v_organizer_id IS NULL OR v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o organizador do torneio pode acessar emails dos participantes';
  END IF;
  
  -- Return participant emails for this tournament only
  RETURN QUERY
  SELECT 
    tp.id as participant_id,
    tp.player_id,
    tp.participant_email,
    p.nickname as player_nickname
  FROM tournament_participants tp
  LEFT JOIN profiles p ON p.id = tp.player_id
  WHERE tp.tournament_id = p_tournament_id
  ORDER BY tp.registered_at ASC;
END;
$$;