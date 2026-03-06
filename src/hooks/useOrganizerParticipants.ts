import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { Profile } from '@/types';

export interface ParticipantWithEmail {
  id: string;
  tournament_id: string;
  player_id: string;
  participant_email: string | null;
  placement: number | null;
  score: number | null;
  registered_at: string;
  player: Profile;
}

export function useOrganizerParticipants(tournamentId: string, isOrganizer: boolean) {
  return useQuery({
    queryKey: ['organizer-participants', tournamentId],
    queryFn: async () => {
      const q = query(
        collection(db, 'tournament_participants'),
        where('tournament_id', '==', tournamentId)
      );
      
      const snapshot = await getDocs(q);
      const basicData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const playerIds = Array.from(new Set(basicData.map((p: any) => p.player_id)));
      
      const profilesMap = new Map<string, Profile>();
      if (playerIds.length > 0) {
        for (let i = 0; i < playerIds.length; i += 10) {
          const chunk = playerIds.slice(i, i + 10);
          const pQuery = query(collection(db, 'profiles'), where(documentId(), 'in', chunk));
          const pSn = await getDocs(pQuery);
          pSn.docs.forEach(d => profilesMap.set(d.id, { id: d.id, ...d.data() } as Profile));
        }
      }

      const merged = basicData.map((p: any) => ({
        id: p.id,
        tournament_id: p.tournament_id,
        player_id: p.player_id,
        participant_email: p.participant_email || null,
        placement: p.placement || null,
        score: p.score || null,
        registered_at: p.registered_at,
        player: profilesMap.get(p.player_id) || {} as Profile
      })) as ParticipantWithEmail[];
      
      return merged.sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());
    },
    enabled: !!tournamentId && isOrganizer,
  });
}

export function useOrganizerTournaments(organizerId: string | undefined) {
  return useQuery({
    queryKey: ['organizer-tournaments', organizerId],
    queryFn: async () => {
      if (!organizerId) return [];
      
      const q = query(
        collection(db, 'tournaments'),
        where('organizer_id', '==', organizerId)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!organizerId,
  });
}
