-- Add banned column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;

-- Create function for admin to delete user (removes from auth.users which cascades to profiles)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem remover usuários';
  END IF;
  
  -- Delete user from auth.users (cascades to profiles, user_roles, etc.)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create function for admin to ban/unban user
CREATE OR REPLACE FUNCTION public.admin_toggle_ban(p_user_id uuid, p_ban boolean, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem banir usuários';
  END IF;
  
  -- Update ban status
  UPDATE public.profiles
  SET 
    is_banned = p_ban,
    banned_at = CASE WHEN p_ban THEN now() ELSE NULL END,
    ban_reason = CASE WHEN p_ban THEN p_reason ELSE NULL END
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create function for admin to set user credits directly
CREATE OR REPLACE FUNCTION public.admin_set_credits(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
BEGIN
  -- Check if caller is admin
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem definir créditos';
  END IF;
  
  -- Set credits directly
  UPDATE public.user_credits
  SET balance = p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction for audit
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'admin_set', 'Créditos definidos pelo admin');
  
  RETURN TRUE;
END;
$$;