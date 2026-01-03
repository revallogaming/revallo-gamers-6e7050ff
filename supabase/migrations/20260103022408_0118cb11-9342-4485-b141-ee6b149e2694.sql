-- Add new game types to the enum
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'league_of_legends';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'valorant';

-- Add new columns to tournaments table for banner and pix key
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS organizer_pix_key text;

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.banner_url IS 'URL da imagem de banner para marketing do torneio';
COMMENT ON COLUMN public.tournaments.organizer_pix_key IS 'Chave PIX do organizador para receber pagamentos';