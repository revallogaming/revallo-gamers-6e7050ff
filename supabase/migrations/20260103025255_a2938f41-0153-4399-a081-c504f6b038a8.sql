-- Remover política duplicada de user_roles
DROP POLICY IF EXISTS "Users can only view their own roles" ON public.user_roles;