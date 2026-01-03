-- SOLUÇÃO: Mover credits para tabela separada com RLS restritivo
-- Isso protege o saldo de créditos enquanto mantém perfis públicos

-- 1. Criar tabela para saldo de créditos (dados privados)
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 3. Política: usuários só podem ver seu próprio saldo
CREATE POLICY "Users can view own credit balance"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Migrar dados existentes de credits para a nova tabela
INSERT INTO public.user_credits (user_id, balance)
SELECT id, credits FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;

-- 5. Atualizar a função spend_credits para usar a nova tabela
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id uuid, 
  p_amount integer, 
  p_type text, 
  p_description text, 
  p_reference_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Atomic read and update with row lock on user_credits
  UPDATE public.user_credits
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND balance >= p_amount
  RETURNING balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, -p_amount, p_type, p_description, p_reference_id);
  
  RETURN TRUE;
END;
$$;

-- 6. Criar função para adicionar créditos (usada pelo webhook)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid, 
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = public.user_credits.balance + p_amount,
    updated_at = now();
END;
$$;

-- 7. Criar trigger para inicializar créditos quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'Player_' || substr(NEW.id::text, 1, 8)));
  
  -- Criar role de player
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  
  -- Inicializar créditos
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;