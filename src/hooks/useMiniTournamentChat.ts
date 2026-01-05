import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentMessage } from '@/types';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useMiniTournamentChat(tournamentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['mini-tournament-messages', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mini_tournament_messages')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_highlighted')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return data.map(m => ({
        ...m,
        user: userMap.get(m.user_id),
      })) as MiniTournamentMessage[];
    },
    enabled: !!tournamentId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`mini-tournament-chat-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mini_tournament_messages',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        async (payload) => {
          // Fetch the full message with user profile
          const { data: newMessage } = await supabase
            .from('mini_tournament_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            // Fetch user profile
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('id, nickname, avatar_url, is_highlighted')
              .eq('id', newMessage.user_id)
              .single();

            const messageWithUser = {
              ...newMessage,
              user: userProfile,
            } as MiniTournamentMessage;

            queryClient.setQueryData(
              ['mini-tournament-messages', tournamentId],
              (old: MiniTournamentMessage[] | undefined) => {
                if (!old) return [messageWithUser];
                // Avoid duplicates
                if (old.some(m => m.id === messageWithUser.id)) return old;
                return [...old, messageWithUser];
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('mini_tournament_messages')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
