import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * Hook to listen for realtime changes on tournament participants.
 * This enables live updates when players join or leave tournaments.
 */
export function useRealtimeParticipants(tournamentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const q = query(
      collection(db, 'tournament_participants'),
      where('tournament_id', '==', tournamentId)
    );

    const unsubscribe = onSnapshot(q, () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['participants', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    }, (error) => {
      console.error("Realtime participants error:", error);
    });

    return () => unsubscribe();
  }, [tournamentId, queryClient]);
}

/**
 * Hook to listen for realtime changes on tournaments list.
 * This enables live updates when tournaments are created, updated, or deleted.
 */
export function useRealtimeTournaments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const q = collection(db, 'tournaments');
    const unsubscribe = onSnapshot(q, () => {
      // Invalidate tournament queries to refetch
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments-infinite'] });
    }, (error) => {
      console.error("Realtime tournaments error:", error);
    });

    return () => unsubscribe();
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

    // Listen to user_credits
    const creditsQuery = query(
      collection(db, 'user_credits'),
      where('user_id', '==', userId)
    );
    
    const unsubscribeCredits = onSnapshot(creditsQuery, () => {
      queryClient.invalidateQueries({ queryKey: ['user_credits', userId] });
    });

    // Listen to pix_payments
    const paymentsQuery = query(
      collection(db, 'pix_payments'),
      where('user_id', '==', userId)
    );
    
    const unsubscribePayments = onSnapshot(paymentsQuery, () => {
      queryClient.invalidateQueries({ queryKey: ['payments', userId] });
      queryClient.invalidateQueries({ queryKey: ['user_credits', userId] });
    });

    return () => {
      unsubscribeCredits();
      unsubscribePayments();
    };
  }, [userId, queryClient]);
}
