-- Create increment_participants function
CREATE OR REPLACE FUNCTION public.increment_participants(tournament_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.tournaments 
  SET current_participants = current_participants + 1
  WHERE id = tournament_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;