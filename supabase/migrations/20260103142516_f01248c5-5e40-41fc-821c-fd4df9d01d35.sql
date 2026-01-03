-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Participants viewable by everyone" ON public.tournament_participants;

-- Create a view for public participant data (without email)
CREATE OR REPLACE VIEW public.public_tournament_participants AS
SELECT 
  id,
  tournament_id,
  player_id,
  placement,
  score,
  registered_at
FROM public.tournament_participants;

-- Policy: Users can view their own participation data (including email)
CREATE POLICY "Users can view own participation"
ON public.tournament_participants
FOR SELECT
USING (auth.uid() = player_id);

-- Policy: Organizers can view all participants of their tournaments (including email)
CREATE POLICY "Organizers can view tournament participants"
ON public.tournament_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE tournaments.id = tournament_participants.tournament_id 
    AND tournaments.organizer_id = auth.uid()
  )
);

-- Grant SELECT on the public view to anon and authenticated
GRANT SELECT ON public.public_tournament_participants TO anon, authenticated;