export type GameType = 'freefire' | 'fortnite' | 'cod' | 'league_of_legends' | 'valorant';
export type TournamentStatus = 'upcoming' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AppRole = 'admin' | 'organizer' | 'player';

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

export const GAME_INFO: Record<GameType, { name: string; color: string }> = {
  freefire: { name: 'Free Fire', color: 'freefire' },
  fortnite: { name: 'Fortnite', color: 'fortnite' },
  cod: { name: 'Call of Duty', color: 'cod' },
  league_of_legends: { name: 'League of Legends', color: 'lol' },
  valorant: { name: 'Valorant', color: 'valorant' },
};

export const STATUS_INFO: Record<TournamentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  upcoming: { label: 'Em breve', variant: 'secondary', color: '#6b7280' },
  open: { label: 'Inscrições abertas', variant: 'default', color: '#22c55e' },
  in_progress: { label: 'Em andamento', variant: 'outline', color: '#f59e0b' },
  completed: { label: 'Finalizado', variant: 'secondary', color: '#6b7280' },
  cancelled: { label: 'Cancelado', variant: 'destructive', color: '#ef4444' },
};