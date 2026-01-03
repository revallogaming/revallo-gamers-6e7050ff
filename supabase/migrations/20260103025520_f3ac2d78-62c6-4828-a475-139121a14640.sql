-- Remover política que permite leitura pública de todos os dados do perfil
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Criar política que permite usuários verem apenas seu próprio perfil completo
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Criar uma view pública para dados não-sensíveis de perfis (para listagens e visualizações públicas)
CREATE OR REPLACE VIEW public.public_profiles AS
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