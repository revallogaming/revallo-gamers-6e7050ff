-- Allow organizers to view participants (including email) for their own tournaments
CREATE POLICY "Organizers can view own tournament participants"
ON public.tournament_participants
FOR SELECT
USING (
  auth.uid() IN (
    SELECT organizer_id 
    FROM public.tournaments 
    WHERE id = tournament_id
  )
);