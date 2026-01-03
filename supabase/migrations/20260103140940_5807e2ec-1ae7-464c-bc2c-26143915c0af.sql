-- Adicionar campo de link na tabela tournaments para o organizador adicionar link externo
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS tournament_link text;

-- Adicionar campo email na tabela tournament_participants para inscrição
ALTER TABLE public.tournament_participants ADD COLUMN IF NOT EXISTS participant_email text;