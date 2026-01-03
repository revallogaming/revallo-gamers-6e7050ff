-- Remove the overly permissive policy we just added
DROP POLICY IF EXISTS "Public can view basic participant info" ON public.tournament_participants;