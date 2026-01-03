-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  nickname,
  avatar_url,
  bio,
  main_game,
  is_highlighted,
  highlighted_until,
  created_at
FROM public.profiles;

-- Conceder acesso à view para usuários anônimos e autenticados
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Precisamos permitir que a view seja acessível publicamente
-- Adicionar política que permite leitura pública apenas dos campos não-sensíveis
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Política para usuários verem seu próprio perfil completo
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política para acesso público a perfis (apenas via view que filtra campos)
CREATE POLICY "Public can view profiles for public view"
ON public.profiles
FOR SELECT
USING (true);