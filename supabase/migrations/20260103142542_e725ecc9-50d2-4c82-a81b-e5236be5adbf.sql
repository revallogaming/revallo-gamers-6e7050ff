-- Drop and recreate the view with SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.public_tournament_participants;

CREATE VIEW public.public_tournament_participants 
WITH (security_invoker = true)
AS
SELECT 
  tp.id,
  tp.tournament_id,
  tp.player_id,
  tp.placement,
  tp.score,
  tp.registered_at
FROM public.tournament_participants tp;