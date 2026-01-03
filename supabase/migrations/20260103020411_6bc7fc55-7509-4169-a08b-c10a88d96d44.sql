-- Fix pix_payments security: ensure only authenticated users can see their own payments
-- Drop existing policy if exists and recreate with proper security
DROP POLICY IF EXISTS "Users can view own payments" ON public.pix_payments;

CREATE POLICY "Users can view own payments" 
ON public.pix_payments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add policy for users to create their own payments
DROP POLICY IF EXISTS "Users can create own payments" ON public.pix_payments;

CREATE POLICY "Users can create own payments" 
ON public.pix_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix tournament_participants: add UPDATE policy for organizers only
DROP POLICY IF EXISTS "Organizers can update participants" ON public.tournament_participants;

CREATE POLICY "Organizers can update participants" 
ON public.tournament_participants 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT organizer_id FROM public.tournaments WHERE id = tournament_id
  )
);