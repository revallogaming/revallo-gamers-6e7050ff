-- Drop existing tables if they exist (from raffle platform)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.raffle_numbers CASCADE;
DROP TABLE IF EXISTS public.raffles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.generate_raffle_numbers CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'player');

-- Create game enum
CREATE TYPE public.game_type AS ENUM ('freefire', 'fortnite', 'cod');

-- Create tournament status enum
CREATE TYPE public.tournament_status AS ENUM ('upcoming', 'open', 'in_progress', 'completed', 'cancelled');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  main_game game_type,
  bio TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  highlighted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  game game_type NOT NULL,
  rules TEXT,
  prize_description TEXT,
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 100,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ NOT NULL,
  status tournament_status NOT NULL DEFAULT 'upcoming',
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  highlighted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  placement INTEGER,
  score INTEGER DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, player_id)
);

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'tournament_entry', 'highlight_profile', 'highlight_tournament', 'prize'
  description TEXT,
  reference_id UUID, -- tournament_id or other reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PIX payments
CREATE TABLE public.pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_brl NUMERIC(10,2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  mercadopago_id TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Tournaments policies
CREATE POLICY "Tournaments are viewable by everyone"
ON public.tournaments FOR SELECT USING (true);

CREATE POLICY "Organizers can create tournaments"
ON public.tournaments FOR INSERT
WITH CHECK (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));

CREATE POLICY "Organizers can update own tournaments"
ON public.tournaments FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own tournaments"
ON public.tournaments FOR DELETE
USING (auth.uid() = organizer_id);

-- Tournament participants policies
CREATE POLICY "Participants viewable by everyone"
ON public.tournament_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can register"
ON public.tournament_participants FOR INSERT
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can unregister themselves"
ON public.tournament_participants FOR DELETE
USING (auth.uid() = player_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PIX payments policies
CREATE POLICY "Users can view own payments"
ON public.pix_payments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments"
ON public.pix_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'Player_' || substr(NEW.id::text, 1, 8)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();