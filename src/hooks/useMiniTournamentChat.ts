import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, documentId } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentMessage, Profile } from '@/types';
import { toast } from 'sonner';

export function useMiniTournamentChat(tournamentId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MiniTournamentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    setIsLoading(true);
    const q = query(
      collection(db, 'mini_tournament_messages'),
      where('tournament_id', '==', tournamentId),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const newMessages = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        })) as any[];

        const userIds = Array.from(new Set(newMessages.map(m => m.user_id)));
        const profilesMap = new Map<string, Profile>();
        
        if (userIds.length > 0) {
          for (let i = 0; i < userIds.length; i += 10) {
            const chunk = userIds.slice(i, i + 10);
            const pQuery = query(collection(db, 'profiles'), where(documentId(), 'in', chunk));
            const pSn = await getDocs(pQuery);
            pSn.docs.forEach(d => profilesMap.set(d.id, { id: d.id, ...d.data() } as Profile));
          }
        }

        const messagesWithUsers = newMessages.map(m => ({
          ...m,
          user: profilesMap.get(m.user_id)
        })) as MiniTournamentMessage[];

        setMessages(messagesWithUsers);
        queryClient.setQueryData(['mini-tournament-messages', tournamentId], messagesWithUsers);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching chat messages:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Chat subscription error:", err);
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!user) throw new Error('Não autenticado');

      await addDoc(collection(db, 'mini_tournament_messages'), {
        tournament_id: tournamentId,
        user_id: user.uid,
        message: messageText.trim(),
        created_at: serverTimestamp()
      });
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
