-- Drop the existing policy that requires organizer role
DROP POLICY IF EXISTS "Organizers can create tournaments" ON public.tournaments;

-- Create new policy allowing any authenticated user to create tournaments
CREATE POLICY "Authenticated users can create tournaments" 
ON public.tournaments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = organizer_id);