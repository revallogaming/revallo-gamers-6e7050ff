import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export interface Message {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  user_photo?: string;
  community_id: string;
  channel_id: string;
  team_name?: string;
  created_at: Timestamp;
}

export function useChat(community_id: string, channel_id: string, channelType?: string, organizerId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!community_id || !channel_id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Standardize to snake_case to match existing schema
    const q = query(
      collection(db, "messages"),
      where("community_id", "==", community_id),
      where("channel_id", "==", channel_id),
      orderBy("created_at", "asc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(newMessages);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [community_id, channel_id]);

  const canSendMessage = () => {
    if (!user) return false;
    if (channelType === 'broadcast') {
      // Only organizer or platform admin can send
      return user.uid === organizerId || user.role === 'admin';
    }
    return true;
  };

  const sendMessage = useMutation({
    mutationFn: async ({ text, teamName }: { text: string; teamName?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (!community_id || !channel_id) throw new Error("Canal não selecionado");
      if (!canSendMessage()) throw new Error("Apenas organizadores podem enviar mensagens neste canal");

      return await addDoc(collection(db, "messages"), {
        content: text,
        user_id: user.uid,
        user_name: user.displayName || "Usuário",
        user_photo: user.photoURL,
        team_name: teamName || null,
        community_id,
        channel_id,
        created_at: serverTimestamp(),
      });
    },
  });

  return { messages, loading, sendMessage, canSendMessage: canSendMessage() };
}
