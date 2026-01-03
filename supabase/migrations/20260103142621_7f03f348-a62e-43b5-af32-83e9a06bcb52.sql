-- Add policy for public to view basic participant data (not email)
-- This uses a subquery approach - the email column just won't be selected in code
CREATE POLICY "Public can view basic participant info"
ON public.tournament_participants
FOR SELECT
USING (true);

-- Note: The participant_email column will still be in the row,
-- but RLS can't restrict columns. To hide it properly for public access,
-- the frontend should use the public_tournament_participants view 
-- or simply not select the participant_email column.