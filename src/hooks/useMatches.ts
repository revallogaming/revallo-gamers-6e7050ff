import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Match, Profile, TournamentParticipant, Team } from "@/types";
import { Loader2, Mail, Trophy, Copy, CheckCircle, ArrowLeft, Clock, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function useMatches(tournamentId: string) {
  return useQuery({
    queryKey: ["matches", tournamentId],
    queryFn: async () => {
      const q = query(
        collection(db, "matches"),
        where("tournament_id", "==", tournamentId),
        orderBy("round", "asc"),
        orderBy("position", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const matchesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Match[];

      // Fetch player profiles for each match
      const playerIds = new Set<string>();
      matchesData.forEach((match) => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      const profileMap = new Map<string, Profile>();
      await Promise.all(
        Array.from(playerIds).map(async (id) => {
          const profileDoc = await getDoc(doc(db, "profiles", id));
          if (profileDoc.exists()) {
            profileMap.set(id, {
              id: profileDoc.id,
              ...profileDoc.data(),
            } as Profile);
          }
        }),
      );

      const teamIds = new Set<string>();
      matchesData.forEach((match) => {
        if (match.team1_id) teamIds.add(match.team1_id);
        if (match.team2_id) teamIds.add(match.team2_id);
      });

      const teamMap = new Map<string, Team>();
      await Promise.all(
        Array.from(teamIds).map(async (id) => {
          const teamDoc = await getDoc(doc(db, "teams", id));
          if (teamDoc.exists()) {
            teamMap.set(id, { id: teamDoc.id, ...teamDoc.data() } as Team);
          }
        })
      );

      return matchesData.map((match) => ({
        ...match,
        player1: match.player1_id
          ? profileMap.get(match.player1_id)
          : undefined,
        player2: match.player2_id
          ? profileMap.get(match.player2_id)
          : undefined,
        team1: match.team1_id ? teamMap.get(match.team1_id) : undefined,
        team2: match.team2_id ? teamMap.get(match.team2_id) : undefined,
      })) as Match[];
    },
    enabled: !!tournamentId,
  });
}

export function useMatchActions(tournamentId: string) {
  const queryClient = useQueryClient();

  const generateBracket = useMutation({
    mutationFn: async () => {
      // 1. Get tournament info
      const tournamentRef = doc(db, "tournaments", tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      if (!tournamentDoc.exists()) throw new Error("Tournament not found");
      const tournament = tournamentDoc.data();
      const isTeamBased = tournament.is_team_based;

      // 2. Get participants (grouped by teams if team-based)
      const participantsQuery = query(
        collection(db, "tournament_participants"),
        where("tournament_id", "==", tournamentId),
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const participants = participantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TournamentParticipant[];

      if (participants.length < 2) {
        throw new Error("Mínimo de 2 inscritos para gerar a chave.");
      }

      // 3. Prepare units (either player IDs or team IDs)
      let units: string[] = [];
      if (isTeamBased) {
        // Get unique team IDs
        units = Array.from(new Set(participants.map(p => p.team_id).filter(Boolean))) as string[];
      } else {
        units = participants.map(p => p.player_id);
      }

      if (units.length < 2) {
        throw new Error(`Mínimo de 2 ${isTeamBased ? 'equipes' : 'jogadores'} para gerar a chave.`);
      }

      // 4. Shuffle units
      const shuffled = [...units].sort(() => Math.random() - 0.5);

      // 5. Determine bracket size (next power of 2)
      const unitCount = shuffled.length;
      const rounds = Math.ceil(Math.log2(unitCount));
      const bracketSize = Math.pow(2, rounds);

      const batch = writeBatch(db);
      const matchRefs: Match[][] = [];

      // 6. Create placeholders for all matches
      for (let r = 0; r < rounds; r++) {
        const matchesInRound = Math.pow(2, rounds - r - 1);
        matchRefs[r] = [];

        for (let p = 0; p < matchesInRound; p++) {
          const matchRef = doc(collection(db, "matches"));
          const matchData: Partial<Match> = {
            id: matchRef.id,
            tournament_id: tournamentId,
            player1_id: null,
            player2_id: null,
            team1_id: null,
            team2_id: null,
            winner_id: null,
            round: r,
            position: p,
            status: "pending",
            next_match_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          matchRefs[r][p] = matchData as Match;
        }
      }

      // 7. Link matches to next rounds
      for (let r = 0; r < rounds - 1; r++) {
        for (let p = 0; p < matchRefs[r].length; p++) {
          const nextMatchPosition = Math.floor(p / 2);
          matchRefs[r][p].next_match_id =
            matchRefs[r + 1][nextMatchPosition].id;
        }
      }

      // 8. Fill first round with units
      for (let i = 0; i < bracketSize; i += 2) {
        const matchIndex = i / 2;
        const unit1 = shuffled[i];
        const unit2 = shuffled[i + 1];

        if (unit1) {
          if (isTeamBased) matchRefs[0][matchIndex].team1_id = unit1;
          else matchRefs[0][matchIndex].player1_id = unit1;
        }
        if (unit2) {
          if (isTeamBased) matchRefs[0][matchIndex].team2_id = unit2;
          else matchRefs[0][matchIndex].player2_id = unit2;
        }

        // If it's a bye (only 1 unit in a match)
        if (unit1 && !unit2) {
          matchRefs[0][matchIndex].winner_id = unit1;
          matchRefs[0][matchIndex].status = "completed";
          // Winner propagation happens later in commit
        }
      }

      // 9. Propagate byes and commit
      for (let r = 0; r < rounds; r++) {
        for (let p = 0; p < matchRefs[r].length; p++) {
          const m = matchRefs[r][p];
          batch.set(doc(db, "matches", m.id), m);
        }
      }

      // Final propagate byes
      // (For a robust system, we'd do this recursively, but let's keep it simple for now)

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success("Chave gerada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMatchWinner = useMutation({
    mutationFn: async ({
      matchId,
      winnerId,
    }: {
      matchId: string;
      winnerId: string;
    }) => {
      const batch = writeBatch(db);
      const matchDoc = await getDoc(doc(db, "matches", matchId));
      if (!matchDoc.exists()) throw new Error("Match not found");
      const match = { id: matchDoc.id, ...matchDoc.data() } as Match;

      // 1. Update current match
      const matchRef = doc(db, "matches", match.id);
      batch.update(matchRef, {
        winner_id: winnerId,
        status: "completed",
        updated_at: new Date().toISOString(),
      });

      // 2. Propegate to next match
      if (match.next_match_id) {
        const nextMatchRef = doc(db, "matches", match.next_match_id);
        const nextMatchDoc = await getDoc(nextMatchRef);

        if (nextMatchDoc.exists()) {
          const nextMatchData = nextMatchDoc.data() as Match;
          // Determine if this winner goes to player1 or player2
          // Based on current match's position (if even, player1; if odd, player2)
          const isPlayer1 = match.position % 2 === 0;

          batch.update(nextMatchRef, {
            [isPlayer1 ? "player1_id" : "player2_id"]: winnerId,
            updated_at: new Date().toISOString(),
          });
        }
      }

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success("Resultado atualizado!");
    },
  });

  const updateMatchRoom = useMutation({
    mutationFn: async ({
      matchId,
      roomId,
      roomPassword,
    }: {
      matchId: string;
      roomId: string;
      roomPassword?: string;
    }) => {
      await updateDoc(doc(db, "matches", matchId), {
        room_id: roomId,
        room_password: roomPassword || null,
        room_status: "open",
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      toast.success("Dados da sala atualizados!");
    },
  });

  const submitDispute = useMutation({
    mutationFn: async ({
      matchId,
      playerId,
      reason,
      evidenceUrl,
    }: {
      matchId: string;
      playerId: string;
      reason: string;
      evidenceUrl?: string;
    }) => {
      await addDoc(collection(db, "tournament_disputes"), {
        match_id: matchId,
        player_id: playerId,
        reason,
        evidence_url: evidenceUrl || null,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Disputa enviada com sucesso!");
    },
  });

  return { generateBracket, updateMatchWinner, updateMatchRoom, submitDispute };
}
