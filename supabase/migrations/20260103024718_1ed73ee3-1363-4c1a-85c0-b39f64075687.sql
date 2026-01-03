-- Fix 1: Create separate table for sensitive organizer payment info
CREATE TABLE public.organizer_payment_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL UNIQUE,
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizer_payment_info ENABLE ROW LEVEL SECURITY;

-- Only organizers can see/manage their own payment info
CREATE POLICY "Organizers can view own payment info" 
ON public.organizer_payment_info 
FOR SELECT 
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can insert own payment info" 
ON public.organizer_payment_info 
FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own payment info" 
ON public.organizer_payment_info 
FOR UPDATE 
USING (auth.uid() = organizer_id);

-- Migrate existing PIX keys to new table
INSERT INTO public.organizer_payment_info (organizer_id, pix_key)
SELECT DISTINCT organizer_id, organizer_pix_key 
FROM public.tournaments 
WHERE organizer_pix_key IS NOT NULL
ON CONFLICT (organizer_id) DO UPDATE SET pix_key = EXCLUDED.pix_key;

-- Drop sensitive column from tournaments table
ALTER TABLE public.tournaments DROP COLUMN IF EXISTS organizer_pix_key;

-- Add trigger for updated_at
CREATE TRIGGER update_organizer_payment_info_updated_at
BEFORE UPDATE ON public.organizer_payment_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix 2: Create a secure function to get public profile (without credits)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  main_game TEXT,
  is_highlighted BOOLEAN,
  highlighted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nickname,
    p.avatar_url,
    p.bio,
    p.main_game::TEXT,
    p.is_highlighted,
    p.highlighted_until,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;