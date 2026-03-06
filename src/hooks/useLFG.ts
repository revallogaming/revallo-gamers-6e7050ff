import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export interface LFGPost {
  id: string;
  game: string;
  rank: string;
  region: string;
  style: string; // Competitive, Casual, Scrims
  title: string;
  description: string;
  slots: {
    role: string;
    filled: boolean;
    userId?: string;
  }[];
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: Timestamp;
  status: "open" | "closed";
}

export const useLFG = (filters?: { game?: string; rank?: string }) => {
  return useQuery({
    queryKey: ["lfg", filters],
    queryFn: async () => {
      // Use only orderBy to avoid composite index requirement
      // Filter status client-side
      const q = query(
        collection(db, "lfg_ads"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      let posts = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as LFGPost,
      );

      // Filter client-side to avoid composite index
      posts = posts.filter(p => p.status === "open");

      if (filters?.game && filters.game !== "Todos") {
        posts = posts.filter(p => p.game === filters.game);
      }

      return posts;
    },
  });
};

export const useLFGActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createLFG = useMutation({
    mutationFn: async (
      data: Omit<
        LFGPost,
        | "id"
        | "authorId"
        | "authorName"
        | "authorPhoto"
        | "createdAt"
        | "status"
      >,
    ) => {
      if (!user) throw new Error("Usuário não autenticado");

      return await addDoc(collection(db, "lfg_ads"), {
        ...data,
        authorId: user.uid,
        authorName: user.displayName || "Usuário",
        authorPhoto: user.photoURL,
        createdAt: serverTimestamp(),
        status: "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lfg"] });
    },
  });

  const joinLFG = useMutation({
    mutationFn: async ({
      lfgId,
      slotIndex,
    }: {
      lfgId: string;
      slotIndex: number;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const lfgRef = doc(db, "lfg_ads", lfgId);

      // Read current doc to validate the slot is still open
      const lfgSnap = await getDoc(lfgRef);
      if (!lfgSnap.exists()) throw new Error("Anúncio não encontrado");

      const data = lfgSnap.data();
      const slots = data.slots || [];
      if (slots[slotIndex]?.filled) {
        throw new Error("Esta vaga já foi preenchida");
      }

      // Check if user already applied
      const apps = data.applications || [];
      if (apps.some((a: any) => a.userId === user.uid)) {
        throw new Error("Você já se candidatou a este anúncio");
      }

      return await updateDoc(lfgRef, {
        applications: arrayUnion({
          userId: user.uid,
          userName: user.displayName,
          slotIndex,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lfg"] });
    },
  });

  return { createLFG, joinLFG };
};
