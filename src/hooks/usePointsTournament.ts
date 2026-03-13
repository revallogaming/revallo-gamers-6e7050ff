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
  addDoc,
  orderBy,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { TournamentFall, FallResult, TournamentParticipant, ScoringSystemConfig } from "@/types";
import { toast } from "sonner";

export function useTournamentFalls(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament-falls", tournamentId],
    queryFn: async () => {
      const q = query(
        collection(db, "tournament_falls"),
        where("tournament_id", "==", tournamentId),
        orderBy("fall_number", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TournamentFall[];
    },
    enabled: !!tournamentId,
  });
}

export function useFallResults(fallId: string) {
  return useQuery({
    queryKey: ["fall-results", fallId],
    queryFn: async () => {
      const q = query(
        collection(db, "fall_results"),
        where("fall_id", "==", fallId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FallResult[];
    },
    enabled: !!fallId,
  });
}

export function useTournamentResults(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament-results", tournamentId],
    queryFn: async () => {
      const fallsQuery = query(
        collection(db, "tournament_falls"),
        where("tournament_id", "==", tournamentId)
      );
      const fallsSnapshot = await getDocs(fallsQuery);
      const fallIds = fallsSnapshot.docs.map(d => d.id);
      
      if (fallIds.length === 0) return [];

      // Firestore doesn't support 'in' with more than 30 elements, but for falls it should be fine
      // Most tournaments have 6-12 falls.
      const resultsQuery = query(
        collection(db, "fall_results"),
        where("fall_id", "in", fallIds)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      return resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FallResult[];
    },
    enabled: !!tournamentId,
  });
}

export function useReportFallResults(tournamentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      fallId, 
      results
    }: { 
      fallId: string, 
      results: Omit<FallResult, 'id' | 'created_at' | 'reported_by'>[]
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const idToken = await user.getIdToken();

      const response = await fetch("/api/report-fall-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tournamentId,
          fallId,
          results
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao reportar resultados");
      return data;
    },
    onSuccess: (_, { fallId }) => {
      queryClient.invalidateQueries({ queryKey: ["fall-results", fallId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-results", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-falls", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["participants", tournamentId] });
      toast.success("Resultados da queda registrados!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useInitializeFalls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, count }: { tournamentId: string, count: number }) => {
      const batch = writeBatch(db);
      for (let i = 1; i <= count; i++) {
        const fallRef = doc(collection(db, "tournament_falls"));
        batch.set(fallRef, {
          tournament_id: tournamentId,
          fall_number: i,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      await batch.commit();
    },
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament-falls", tournamentId] });
      toast.success("Partidas (Quedas) inicializadas!");
    }
  });
}
