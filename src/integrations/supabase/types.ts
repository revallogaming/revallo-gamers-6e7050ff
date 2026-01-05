export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      mini_tournament_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_tournament_messages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "mini_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_tournament_participants: {
        Row: {
          id: string
          placement: number | null
          player_id: string
          prize_amount_brl: number | null
          prize_paid: boolean
          prize_paid_at: string | null
          prize_transfer_id: string | null
          registered_at: string
          tournament_id: string
        }
        Insert: {
          id?: string
          placement?: number | null
          player_id: string
          prize_amount_brl?: number | null
          prize_paid?: boolean
          prize_paid_at?: string | null
          prize_transfer_id?: string | null
          registered_at?: string
          tournament_id: string
        }
        Update: {
          id?: string
          placement?: number | null
          player_id?: string
          prize_amount_brl?: number | null
          prize_paid?: boolean
          prize_paid_at?: string | null
          prize_transfer_id?: string | null
          registered_at?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "mini_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_tournaments: {
        Row: {
          created_at: string
          current_participants: number
          deposit_confirmed: boolean
          deposit_confirmed_at: string | null
          deposit_payment_id: string | null
          description: string | null
          entry_fee_credits: number
          format: Database["public"]["Enums"]["mini_tournament_format"]
          game: Database["public"]["Enums"]["game_type"]
          id: string
          max_participants: number
          organizer_id: string
          prize_distribution: Json
          prize_pool_brl: number
          prizes_distributed_at: string | null
          registration_deadline: string
          results_submitted_at: string | null
          rules: string | null
          start_date: string
          status: Database["public"]["Enums"]["mini_tournament_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_participants?: number
          deposit_confirmed?: boolean
          deposit_confirmed_at?: string | null
          deposit_payment_id?: string | null
          description?: string | null
          entry_fee_credits?: number
          format?: Database["public"]["Enums"]["mini_tournament_format"]
          game?: Database["public"]["Enums"]["game_type"]
          id?: string
          max_participants?: number
          organizer_id: string
          prize_distribution?: Json
          prize_pool_brl: number
          prizes_distributed_at?: string | null
          registration_deadline: string
          results_submitted_at?: string | null
          rules?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["mini_tournament_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_participants?: number
          deposit_confirmed?: boolean
          deposit_confirmed_at?: string | null
          deposit_payment_id?: string | null
          description?: string | null
          entry_fee_credits?: number
          format?: Database["public"]["Enums"]["mini_tournament_format"]
          game?: Database["public"]["Enums"]["game_type"]
          id?: string
          max_participants?: number
          organizer_id?: string
          prize_distribution?: Json
          prize_pool_brl?: number
          prizes_distributed_at?: string | null
          registration_deadline?: string
          results_submitted_at?: string | null
          rules?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["mini_tournament_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizer_payment_info: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          pix_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          pix_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          pix_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pix_payments: {
        Row: {
          amount_brl: number
          created_at: string
          credits_amount: number
          id: string
          mercadopago_id: string | null
          paid_at: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount_brl: number
          created_at?: string
          credits_amount: number
          id?: string
          mercadopago_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          credits_amount?: number
          id?: string
          mercadopago_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_deposits: {
        Row: {
          amount_brl: number
          created_at: string
          id: string
          mercadopago_id: string | null
          organizer_id: string
          paid_at: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
        }
        Insert: {
          amount_brl: number
          created_at?: string
          id?: string
          mercadopago_id?: string | null
          organizer_id: string
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          id?: string
          mercadopago_id?: string | null
          organizer_id?: string
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_deposits_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "mini_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_distributions: {
        Row: {
          amount_brl: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          participant_id: string
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          placement: number
          player_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
          transfer_id: string | null
        }
        Insert: {
          amount_brl: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          participant_id: string
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          placement: number
          player_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
          transfer_id?: string | null
        }
        Update: {
          amount_brl?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          participant_id?: string
          pix_key?: string
          pix_key_type?: Database["public"]["Enums"]["pix_key_type"]
          placement?: number
          player_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id?: string
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_distributions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "mini_tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_distributions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "mini_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          created_at: string
          highlighted_until: string | null
          id: string
          is_banned: boolean
          is_highlighted: boolean
          main_game: Database["public"]["Enums"]["game_type"] | null
          nickname: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          highlighted_until?: string | null
          id: string
          is_banned?: boolean
          is_highlighted?: boolean
          main_game?: Database["public"]["Enums"]["game_type"] | null
          nickname: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          highlighted_until?: string | null
          id?: string
          is_banned?: boolean
          is_highlighted?: boolean
          main_game?: Database["public"]["Enums"]["game_type"] | null
          nickname?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          report_type: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          participant_email: string | null
          placement: number | null
          player_id: string
          registered_at: string
          score: number | null
          tournament_id: string
        }
        Insert: {
          id?: string
          participant_email?: string | null
          placement?: number | null
          player_id: string
          registered_at?: string
          score?: number | null
          tournament_id: string
        }
        Update: {
          id?: string
          participant_email?: string | null
          placement?: number | null
          player_id?: string
          registered_at?: string
          score?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          current_participants: number
          description: string | null
          end_date: string | null
          entry_fee: number
          game: Database["public"]["Enums"]["game_type"]
          highlighted_until: string | null
          id: string
          is_highlighted: boolean
          max_participants: number
          organizer_id: string
          prize_description: string | null
          registration_deadline: string
          rules: string | null
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          tournament_link: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          current_participants?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          game: Database["public"]["Enums"]["game_type"]
          highlighted_until?: string | null
          id?: string
          is_highlighted?: boolean
          max_participants?: number
          organizer_id: string
          prize_description?: string | null
          registration_deadline: string
          rules?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          tournament_link?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          current_participants?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          game?: Database["public"]["Enums"]["game_type"]
          highlighted_until?: string | null
          id?: string
          is_highlighted?: boolean
          max_participants?: number
          organizer_id?: string
          prize_description?: string | null
          registration_deadline?: string
          rules?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          tournament_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pix_keys: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["pix_key_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          pix_key?: string
          pix_key_type?: Database["public"]["Enums"]["pix_key_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          highlighted_until: string | null
          id: string | null
          is_highlighted: boolean | null
          main_game: Database["public"]["Enums"]["game_type"] | null
          nickname: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          highlighted_until?: string | null
          id?: string | null
          is_highlighted?: boolean | null
          main_game?: Database["public"]["Enums"]["game_type"] | null
          nickname?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          highlighted_until?: string | null
          id?: string | null
          is_highlighted?: boolean | null
          main_game?: Database["public"]["Enums"]["game_type"] | null
          nickname?: string | null
        }
        Relationships: []
      }
      public_tournament_participants: {
        Row: {
          id: string | null
          placement: number | null
          player_id: string | null
          registered_at: string | null
          score: number | null
          tournament_id: string | null
        }
        Insert: {
          id?: string | null
          placement?: number | null
          player_id?: string | null
          registered_at?: string | null
          score?: number | null
          tournament_id?: string | null
        }
        Update: {
          id?: string | null
          placement?: number | null
          player_id?: string | null
          registered_at?: string | null
          score?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      admin_add_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      admin_add_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      admin_delete_user: { Args: { p_user_id: string }; Returns: boolean }
      admin_remove_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      admin_set_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      admin_toggle_ban: {
        Args: { p_ban: boolean; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_organizer_participant_emails: {
        Args: { p_tournament_id: string }
        Returns: {
          participant_email: string
          participant_id: string
          player_id: string
          player_nickname: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          highlighted_until: string
          id: string
          is_highlighted: boolean
          main_game: string
          nickname: string
        }[]
      }
      get_tournament_participants: {
        Args: { p_tournament_id: string }
        Returns: {
          id: string
          placement: number
          player_avatar_url: string
          player_id: string
          player_is_highlighted: boolean
          player_nickname: string
          registered_at: string
          score: number
          tournament_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      spend_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "organizer" | "player"
      game_type:
        | "freefire"
        | "fortnite"
        | "cod"
        | "league_of_legends"
        | "valorant"
      mini_tournament_format: "x1" | "duo" | "squad" | "trio"
      mini_tournament_status:
        | "draft"
        | "pending_deposit"
        | "open"
        | "in_progress"
        | "awaiting_result"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      pix_key_type: "cpf" | "phone" | "email" | "random"
      tournament_status:
        | "upcoming"
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "organizer", "player"],
      game_type: [
        "freefire",
        "fortnite",
        "cod",
        "league_of_legends",
        "valorant",
      ],
      mini_tournament_format: ["x1", "duo", "squad", "trio"],
      mini_tournament_status: [
        "draft",
        "pending_deposit",
        "open",
        "in_progress",
        "awaiting_result",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      pix_key_type: ["cpf", "phone", "email", "random"],
      tournament_status: [
        "upcoming",
        "open",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
