-- Create a function to get tournament participants with profile data, excluding email for public access
CREATE OR REPLACE FUNCTION public.get_tournament_participants(p_tournament_id uuid)
RETURNS TABLE (
  id uuid,
  tournament_id uuid,
  player_id uuid,
  placement integer,
  score integer,
  registered_at timestamptz,
  player_nickname text,
  player_avatar_url text,
  player_is_highlighted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id,
    tp.tournament_id,
    tp.player_id,
    tp.placement,
    tp.score,
    tp.registered_at,
    p.nickname,
    p.avatar_url,
    p.is_highlighted
  FROM public.tournament_participants tp
  LEFT JOIN public.profiles p ON p.id = tp.player_id
  WHERE tp.tournament_id = p_tournament_id
  ORDER BY tp.score DESC NULLS LAST, tp.registered_at ASC;
END;
$$;