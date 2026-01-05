-- Enum para tipo de chave Pix
CREATE TYPE public.pix_key_type AS ENUM ('cpf', 'phone', 'email', 'random');

-- Enum para formato de mini torneio
CREATE TYPE public.mini_tournament_format AS ENUM ('x1', 'duo', 'squad');

-- Enum para status do mini torneio
CREATE TYPE public.mini_tournament_status AS ENUM ('draft', 'pending_deposit', 'open', 'in_progress', 'awaiting_result', 'completed', 'cancelled');

-- Tabela de chaves Pix dos usuários (universal)
CREATE TABLE public.user_pix_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pix_key_type pix_key_type NOT NULL,
  pix_key TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pix_keys ENABLE ROW LEVEL SECURITY;

-- Policies para user_pix_keys
CREATE POLICY "Users can view own pix key"
ON public.user_pix_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pix key"
ON public.user_pix_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pix key"
ON public.user_pix_keys FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela de mini torneios
CREATE TABLE public.mini_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  game public.game_type NOT NULL DEFAULT 'freefire',
  format mini_tournament_format NOT NULL DEFAULT 'x1',
  max_participants INTEGER NOT NULL DEFAULT 2,
  entry_fee_credits INTEGER NOT NULL DEFAULT 0,
  prize_pool_brl NUMERIC(10,2) NOT NULL,
  prize_distribution JSONB NOT NULL DEFAULT '[{"place": 1, "percentage": 100}]'::jsonb,
  rules TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status mini_tournament_status NOT NULL DEFAULT 'draft',
  current_participants INTEGER NOT NULL DEFAULT 0,
  deposit_confirmed BOOLEAN NOT NULL DEFAULT false,
  deposit_payment_id UUID,
  deposit_confirmed_at TIMESTAMP WITH TIME ZONE,
  results_submitted_at TIMESTAMP WITH TIME ZONE,
  prizes_distributed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mini_tournaments ENABLE ROW LEVEL SECURITY;

-- Policies para mini_tournaments
CREATE POLICY "Mini tournaments are viewable by everyone"
ON public.mini_tournaments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create mini tournaments"
ON public.mini_tournaments FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own mini tournaments"
ON public.mini_tournaments FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own mini tournaments"
ON public.mini_tournaments FOR DELETE
USING (auth.uid() = organizer_id AND status IN ('draft', 'pending_deposit'));

-- Tabela de participantes dos mini torneios
CREATE TABLE public.mini_tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.mini_tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  placement INTEGER,
  prize_amount_brl NUMERIC(10,2),
  prize_paid BOOLEAN NOT NULL DEFAULT false,
  prize_paid_at TIMESTAMP WITH TIME ZONE,
  prize_transfer_id TEXT,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS
ALTER TABLE public.mini_tournament_participants ENABLE ROW LEVEL SECURITY;

-- Policies para mini_tournament_participants
CREATE POLICY "Anyone can view participants"
ON public.mini_tournament_participants FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can register"
ON public.mini_tournament_participants FOR INSERT
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can unregister themselves"
ON public.mini_tournament_participants FOR DELETE
USING (auth.uid() = player_id);

CREATE POLICY "Organizers can update participants"
ON public.mini_tournament_participants FOR UPDATE
USING (auth.uid() IN (
  SELECT organizer_id FROM public.mini_tournaments WHERE id = tournament_id
));

-- Tabela de depósitos de premiação
CREATE TABLE public.prize_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.mini_tournaments(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  mercadopago_id TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prize_deposits ENABLE ROW LEVEL SECURITY;

-- Policies para prize_deposits
CREATE POLICY "Organizers can view own deposits"
ON public.prize_deposits FOR SELECT
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create deposits"
ON public.prize_deposits FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

-- Tabela de mensagens do chat do torneio
CREATE TABLE public.mini_tournament_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.mini_tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mini_tournament_messages ENABLE ROW LEVEL SECURITY;

-- Policies para mini_tournament_messages
CREATE POLICY "Participants can view messages"
ON public.mini_tournament_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mini_tournament_participants
    WHERE tournament_id = mini_tournament_messages.tournament_id
    AND player_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.mini_tournaments
    WHERE id = mini_tournament_messages.tournament_id
    AND organizer_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages"
ON public.mini_tournament_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.mini_tournament_participants
      WHERE tournament_id = mini_tournament_messages.tournament_id
      AND player_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.mini_tournaments
      WHERE id = mini_tournament_messages.tournament_id
      AND organizer_id = auth.uid()
    )
  )
);

-- Tabela de log de distribuição de prêmios
CREATE TABLE public.prize_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.mini_tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.mini_tournament_participants(id),
  player_id UUID NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  placement INTEGER NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type pix_key_type NOT NULL,
  transfer_id TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.prize_distributions ENABLE ROW LEVEL SECURITY;

-- Policies para prize_distributions
CREATE POLICY "Players can view own distributions"
ON public.prize_distributions FOR SELECT
USING (auth.uid() = player_id);

CREATE POLICY "Organizers can view tournament distributions"
ON public.prize_distributions FOR SELECT
USING (auth.uid() IN (
  SELECT organizer_id FROM public.mini_tournaments WHERE id = tournament_id
));

-- Função para atualizar contador de participantes
CREATE OR REPLACE FUNCTION public.update_mini_tournament_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.mini_tournaments 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.mini_tournaments 
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para atualizar contador
CREATE TRIGGER update_mini_tournament_participants_count
AFTER INSERT OR DELETE ON public.mini_tournament_participants
FOR EACH ROW EXECUTE FUNCTION public.update_mini_tournament_participant_count();

-- Trigger para updated_at nas tabelas
CREATE TRIGGER update_user_pix_keys_updated_at
BEFORE UPDATE ON public.user_pix_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mini_tournaments_updated_at
BEFORE UPDATE ON public.mini_tournaments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mini_tournament_messages;