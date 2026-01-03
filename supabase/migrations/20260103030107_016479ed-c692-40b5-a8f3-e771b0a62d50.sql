-- Remover coluna credits da tabela profiles (dados agora estão em user_credits)
-- NOTA: Isso é seguro porque os dados já foram migrados para user_credits
ALTER TABLE public.profiles DROP COLUMN IF EXISTS credits;