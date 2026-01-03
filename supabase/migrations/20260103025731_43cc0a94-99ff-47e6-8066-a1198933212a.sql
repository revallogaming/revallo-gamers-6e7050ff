-- Restaurar política de leitura pública para profiles
-- A view public_profiles (que exclui credits) precisa desta política para funcionar
-- A função get_public_profile() também precisa desta política
CREATE POLICY "Anyone can read public profile data"
ON public.profiles
FOR SELECT
USING (true);