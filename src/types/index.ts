export type GameType = 'freefire' | 'valorant' | 'cod-warzone' | 'blood_strike';
export type TournamentType = 'bracket' | 'points' | 'duel';
export type ScoringSystemType = 'lbff' | 'high_scoring' | 'simplified' | 'custom' | 'duel';
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
export type MatchRoomStatus = 'not_started' | 'room_created' | 'active' | 'finished';
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected';
export type TournamentStatus = 'upcoming' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AppRole = 'admin' | 'organizer' | 'player';
export type PixKeyType = 'cpf' | 'phone' | 'email' | 'random';
export type MiniTournamentFormat = 'x1' | 'duo' | 'trio' | 'squad' | '4v4';
export type MiniTournamentStatus = 'draft' | 'pending_deposit' | 'open' | 'in_progress' | 'awaiting_result' | 'completed' | 'cancelled';
export type TournamentRole = 'organizer' | 'admin' | 'participant' | 'viewer';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  icon_url: string | null;
  owner_id: string;
  member_count: number;
  game: GameType | null;
  is_public: boolean;
  type?: 'social' | 'tournament';
  tournament_id?: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  muted?: boolean;
  user?: Profile;
  notifications_enabled?: boolean;
}

export interface Channel {
  id: string;
  community_id: string;
  name: string;
  description: string | null;
  type: 'text' | 'voice' | 'announcement' | 'broadcast';
  position: number;
  is_temporary?: boolean | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  type?: string;
  audio_url?: string | null;
  created_at: string;
  updated_at: string | null;
  expires_at?: string | null;
  deleted_for?: string[] | null;
  user?: Profile;
}


export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  main_game: GameType | null;
  bio: string | null;
  credits?: number;
  is_highlighted: boolean;
  highlighted_until: string | null;
  verification_type?: 'none' | 'admin' | 'influencer' | 'verified';
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: any;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  isGuest: boolean;
  signIn: (e: string, p: string, rememberMe?: boolean) => Promise<{error: Error | null}>;
  signUp: (e: string, p: string, n: string) => Promise<{error: Error | null}>;
  signOut: () => Promise<void>;
  resetPassword: (e: string) => Promise<{error: Error | null}>;
  refreshProfile: () => Promise<void>;
  hasRole: (r: 'admin' | 'organizer' | 'player') => boolean;
}

export interface ScoringSystemConfig {
  type: ScoringSystemType;
  placement_points: Record<number, number>;
  points_per_kill: number;
  booyah_bonus?: number;
  top5_bonus?: number;
  tie_breaker_rules?: string[]; // e.g. ['booyahs', 'kills', 'best_placement', 'last_fall']
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
  is_team_based?: boolean;
  format?: MiniTournamentFormat;
  min_team_size?: number;
  max_team_size?: number;
  room_info_visible?: boolean;
  created_at: string;
  updated_at: string;
  organizer?: Profile;
  community_id?: string;
  prize_pool_total?: number;
  prize_amount?: number;
  prizes_paid_at?: string | null;
  type: TournamentType;
  scoring_config?: ScoringSystemConfig;
  total_falls?: number; 
  entry_fee_brl?: number;
  prize_amount_brl?: number;
  fee_type?: 'per_player' | 'per_team';
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
  team_id?: string | null;
  team_name?: string | null;
  role?: 'captain' | 'player' | 'coach' | 'analista' | null;
  placement: number | null;
  score: number;
  registered_at: string;
  participant_email: string | null;
  pix_key?: string | null;
  pix_key_type?: PixKeyType | null;
  player?: Profile;
  total_kills?: number;
  booyahs?: number;
  last_fall_placement?: number;
  best_placement?: number;
}

export interface FallResult {
  id: string;
  fall_id: string;
  participant_id: string; // Points to TournamentParticipant
  placement: number;
  kills: number;
  points: number;
  reported_by: string; // UID of admin/organizer
  created_at: string;
}

export interface TournamentFall {
  id: string;
  tournament_id: string;
  fall_number: number; // 1, 2, 3...
  map?: string;
  status: 'pending' | 'live' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  player1_id: string | null;
  player2_id: string | null;
  team1_id?: string | null;
  team2_id?: string | null;
  winner_id: string | null;
  round: number;
  position: number;
  status: MatchStatus;
  next_match_id: string | null;
  room_id?: string | null;
  room_password?: string | null;
  room_status?: MatchRoomStatus;
  created_at: string;
  updated_at: string;
  player1?: Profile;
  player2?: Profile;
  team1?: Team;
  team2?: Team;
}

export interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  captain_id: string;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  user?: Profile;
}

export interface TournamentDispute {
  id: string;
  tournament_id: string;
  match_id: string;
  reporter_id: string;
  reason: string;
  evidence_url: string | null;
  status: DisputeStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
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
  entry_fee_brl: number;
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
  banner_url?: string;
  map?: string | null;
  organizer?: Profile;
  fee_type?: 'per_player' | 'per_team';
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
  valorant: { name: 'Valorant', color: 'valorant' },
  'cod-warzone': { name: 'Warzone', color: 'cod' },
  blood_strike: { name: 'Blood Strike', color: 'bloodstrike' },
};

// Duel System Types
export type MatchDuelStatus = 'open' | 'matched' | 'playing' | 'finished' | 'disputed' | 'cancelled';

export interface MatchDuel {
  id: string;
  game: GameType;
  mode: string; // e.g., '4v4'
  entry_fee_brl: number;
  prize_pool_brl: number;
  platform_fee_brl: number;
  title: string;
  banner_url?: string;
  format: string; // e.g., 'MD3'
  map: string; // e.g., 'Bermuda'
  status: MatchDuelStatus;
  teamA_id: string;
  teamB_id?: string;
  creator_id: string;
  creator?: Profile;
  created_at: string;
  updated_at: string;
}

export interface MatchDuelResult {
  id: string;
  match_id: string;
  team_id: string;
  rounds_won: number;
  kills: number;
  screenshots: string[];
  submitted_by: string;
  created_at: string;
}

export interface MatchDuelPayout {
  id: string;
  player_id: string;
  match_id: string;
  amount_brl: number;
  status: 'pending' | 'paid';
  created_at: string;
  paid_at?: string;
}

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
  trio: { label: 'Trio (3v3)', players: 3 },
  squad: { label: 'Squad (Battle Royale)', players: 4 },
  '4v4': { label: '4v4 (Apostado)', players: 4 },
};

export const PIX_KEY_TYPE_INFO: Record<PixKeyType, { label: string; placeholder: string; pattern: RegExp }> = {
  cpf: { label: 'CPF', placeholder: '000.000.000-00', pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/ },
  phone: { label: 'Telefone', placeholder: '+55 11 99999-9999', pattern: /^\+?\d{10,15}$/ },
  email: { label: 'E-mail', placeholder: 'exemplo@email.com', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  random: { label: 'Chave Aleatória', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', pattern: /^[a-f0-9-]{32,36}$/i },
};

export const SCORING_SYSTEMS: Record<Exclude<ScoringSystemType, 'custom'>, ScoringSystemConfig> = {
  lbff: {
    type: 'lbff',
    placement_points: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 },
    points_per_kill: 1,
    tie_breaker_rules: ['booyahs', 'kills', 'best_placement', 'last_fall']
  },
  high_scoring: {
    type: 'high_scoring',
    placement_points: { 1: 1000, 2: 750, 3: 500, 4: 400, 5: 350, 6: 300, 7: 250, 8: 200, 9: 150, 10: 100 },
    points_per_kill: 25,
    tie_breaker_rules: ['booyahs', 'kills', 'best_placement', 'last_fall']
  },
  simplified: {
    type: 'simplified',
    placement_points: { 1: 10, 2: 8, 3: 7, 4: 6, 5: 5 },
    points_per_kill: 1,
    tie_breaker_rules: ['booyahs', 'kills', 'best_placement', 'last_fall']
  },
  duel: {
    type: 'duel',
    placement_points: {},
    points_per_kill: 0,
    tie_breaker_rules: ['rounds_won', 'kills']
  }
};