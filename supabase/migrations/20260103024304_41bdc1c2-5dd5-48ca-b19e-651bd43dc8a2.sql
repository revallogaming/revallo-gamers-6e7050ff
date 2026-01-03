-- Fix 1: Drop the vulnerable increment_participants function and create a trigger instead
DROP FUNCTION IF EXISTS public.increment_participants(uuid);

-- Create function to automatically update participant count
CREATE OR REPLACE FUNCTION public.update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tournaments 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tournaments 
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic count updates
CREATE TRIGGER tournament_participant_count_trigger
AFTER INSERT OR DELETE ON public.tournament_participants
FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Fix 2: Create atomic spend_credits function to prevent race conditions
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Atomic read and update with row lock
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id 
    AND credits >= p_amount
  RETURNING credits INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, -p_amount, p_type, p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;