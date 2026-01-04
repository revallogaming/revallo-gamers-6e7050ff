import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to listen for realtime changes on tournament participants.
 * This enables live updates when players join or leave tournaments.
 */
export function useRealtimeParticipants(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament-participants-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tournament_participants',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          // Invalidate queries to refetch updated data
          queryClient.invalidateQueries({ queryKey: ['participants', tournamentId] });
          queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);
}

/**
 * Hook to listen for realtime changes on tournaments list.
 * This enables live updates when tournaments are created, updated, or deleted.
 */
export function useRealtimeTournaments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('tournaments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
        },
        () => {
          // Invalidate tournament queries to refetch
          queryClient.invalidateQueries({ queryKey: ['tournaments'] });
          queryClient.invalidateQueries({ queryKey: ['tournaments-infinite'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook to listen for realtime credit updates for a user.
 * Critical for showing live balance after payments are confirmed.
 */
export function useRealtimeCredits(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user_credits', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pix_payments',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments', userId] });
          queryClient.invalidateQueries({ queryKey: ['user_credits', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
