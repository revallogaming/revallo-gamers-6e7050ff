export type GameType = 'freefire' | 'fortnite' | 'cod' | 'league_of_legends' | 'valorant';
export type TournamentStatus = 'upcoming' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AppRole = 'admin' | 'organizer' | 'player';
export type PixKeyType = 'cpf' | 'phone' | 'email' | 'random';
export type MiniTournamentFormat = 'x1' | 'duo' | 'squad';
export type MiniTournamentStatus = 'draft' | 'pending_deposit' | 'open' | 'in_progress' | 'awaiting_result' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  main_game: GameType | null;
  bio: string | null;
  credits?: number;
  is_highlighted: boolean;
  highlighted_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  game: GameType;
  rules: string | null;
  prize_description: string | null;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  start_date: string;
  end_date: string | null;
  registration_deadline: string;
  status: TournamentStatus;
  is_highlighted: boolean;
  highlighted_until: string | null;
  banner_url: string | null;
  tournament_link: string | null;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
}

export interface OrganizerPaymentInfo {
  id: string;
  organizer_id: string;
  pix_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  placement: number | null;
  score: number;
  registered_at: string;
  participant_email: string | null;
  player?: Profile;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface PixPayment {
  id: string;
  user_id: string;
  amount_brl: number;
  credits_amount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  mercadopago_id: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserPixKey {
  id: string;
  user_id: string;
  pix_key_type: PixKeyType;
  pix_key: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrizeDistributionConfig {
  place: number;
  percentage: number;
}

export interface MiniTournament {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  game: GameType;
  format: MiniTournamentFormat;
  max_participants: number;
  entry_fee_credits: number;
  prize_pool_brl: number;
  prize_distribution: PrizeDistributionConfig[];
  rules: string | null;
  start_date: string;
  registration_deadline: string;
  status: MiniTournamentStatus;
  current_participants: number;
  deposit_confirmed: boolean;
  deposit_payment_id: string | null;
  deposit_confirmed_at: string | null;
  results_submitted_at: string | null;
  prizes_distributed_at: string | null;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
}

export interface MiniTournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  placement: number | null;
  prize_amount_brl: number | null;
  prize_paid: boolean;
  prize_paid_at: string | null;
  prize_transfer_id: string | null;
  registered_at: string;
  player?: Profile;
}

export interface PrizeDeposit {
  id: string;
  tournament_id: string;
  organizer_id: string;
  amount_brl: number;
  mercadopago_id: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
}

export interface MiniTournamentMessage {
  id: string;
  tournament_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: Profile;
}

export interface PrizeDistribution {
  id: string;
  tournament_id: string;
  participant_id: string;
  player_id: string;
  amount_brl: number;
  placement: number;
  pix_key: string;
  pix_key_type: PixKeyType;
  transfer_id: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const GAME_INFO: Record<GameType, { name: string; color: string }> = {
  freefire: { name: 'Free Fire', color: 'freefire' },
  fortnite: { name: 'Fortnite', color: 'fortnite' },
  cod: { name: 'Call of Duty', color: 'cod' },
  league_of_legends: { name: 'League of Legends', color: 'lol' },
  valorant: { name: 'Valorant', color: 'valorant' },
};

export const STATUS_INFO: Record<TournamentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  upcoming: { label: 'Inscrições abertas', variant: 'default', color: '#22c55e' },
  open: { label: 'Inscrições abertas', variant: 'default', color: '#22c55e' },
  in_progress: { label: 'Em andamento', variant: 'outline', color: '#f59e0b' },
  completed: { label: 'Finalizado', variant: 'secondary', color: '#6b7280' },
  cancelled: { label: 'Cancelado', variant: 'destructive', color: '#ef4444' },
};

export const MINI_TOURNAMENT_STATUS_INFO: Record<MiniTournamentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: 'Rascunho', variant: 'outline', color: '#6b7280' },
  pending_deposit: { label: 'Aguardando Depósito', variant: 'outline', color: '#f59e0b' },
  open: { label: 'Aberto', variant: 'default', color: '#22c55e' },
  in_progress: { label: 'Em andamento', variant: 'outline', color: '#3b82f6' },
  awaiting_result: { label: 'Aguardando Resultado', variant: 'outline', color: '#8b5cf6' },
  completed: { label: 'Finalizado', variant: 'secondary', color: '#6b7280' },
  cancelled: { label: 'Cancelado', variant: 'destructive', color: '#ef4444' },
};

export const FORMAT_INFO: Record<MiniTournamentFormat, { label: string; players: number }> = {
  x1: { label: 'X1 (1v1)', players: 1 },
  duo: { label: 'Duo (2v2)', players: 2 },
  squad: { label: 'Squad (4v4)', players: 4 },
};

export const PIX_KEY_TYPE_INFO: Record<PixKeyType, { label: string; placeholder: string; pattern: RegExp }> = {
  cpf: { label: 'CPF', placeholder: '000.000.000-00', pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/ },
  phone: { label: 'Telefone', placeholder: '+55 11 99999-9999', pattern: /^\+?\d{10,15}$/ },
  email: { label: 'E-mail', placeholder: 'exemplo@email.com', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  random: { label: 'Chave Aleatória', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', pattern: /^[a-f0-9-]{32,36}$/i },
};