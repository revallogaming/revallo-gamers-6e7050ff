-- Remover a política de acesso público à tabela profiles
-- Apenas usuários autenticados podem ver seus próprios perfis
-- Para dados públicos, usar a função get_public_profile()
DROP POLICY IF EXISTS "Public can view profiles for public view" ON public.profiles;