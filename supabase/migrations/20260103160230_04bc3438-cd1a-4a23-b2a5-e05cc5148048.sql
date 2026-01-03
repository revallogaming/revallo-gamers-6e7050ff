-- Função segura para admin adicionar créditos (permite valores negativos para remoção)
CREATE OR REPLACE FUNCTION public.admin_add_credits(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_current_balance INTEGER;
BEGIN
  -- Check if caller is admin
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem modificar créditos';
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance FROM public.user_credits WHERE user_id = p_user_id;
  
  -- Check if removal would result in negative balance
  IF p_amount < 0 AND (v_current_balance + p_amount) < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente para remover esta quantidade';
  END IF;
  
  -- Update credits
  UPDATE public.user_credits
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction for audit
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, CASE WHEN p_amount > 0 THEN 'admin_add' ELSE 'admin_remove' END, 
          CASE WHEN p_amount > 0 THEN 'Créditos adicionados pelo admin' ELSE 'Créditos removidos pelo admin' END);
  
  RETURN TRUE;
END;
$$;

-- Função para admin adicionar role
CREATE OR REPLACE FUNCTION public.admin_add_role(p_user_id uuid, p_role app_role)
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
    RAISE EXCEPTION 'Apenas administradores podem modificar roles';
  END IF;
  
  -- Insert role (ignore if already exists due to unique constraint)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Função para admin remover role
CREATE OR REPLACE FUNCTION public.admin_remove_role(p_user_id uuid, p_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_admin_count INTEGER;
BEGIN
  -- Check if caller is admin
  SELECT public.has_role(auth.uid(), 'admin') INTO v_caller_is_admin;
  
  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem modificar roles';
  END IF;
  
  -- Prevent removing the last admin
  IF p_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count FROM public.user_roles WHERE role = 'admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador';
    END IF;
  END IF;
  
  -- Remove role
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
  
  RETURN TRUE;
END;
$$;