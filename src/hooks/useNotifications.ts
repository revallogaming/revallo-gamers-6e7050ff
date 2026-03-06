"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useEffect } from "react";

export type NotificationType =
  | "tournament_invite"
  | "team_invite"
  | "tournament_result"
  | "general";

export interface AppNotification {
  id: string;
  type: NotificationType;
  to_user_id: string;
  from_user_id: string;
  from_nickname: string;
  title: string;
  body: string;
  action_url?: string;
  read: boolean;
  created_at: any;
  metadata?: Record<string, any>;
}

// Send a notification to a user
export function useSendNotification() {
  return useMutation({
    mutationFn: async (notification: Omit<AppNotification, "id" | "read" | "created_at">) => {
      await addDoc(collection(db, "notifications"), {
        ...notification,
        read: false,
        created_at: serverTimestamp(),
      });
    },
  });
}

// Fetch notifications for the current user (realtime)
export function useNotifications(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("to_user_id", "==", userId),
      orderBy("created_at", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];
      queryClient.setQueryData(["notifications", userId], notifs);
    });

    return () => unsub();
  }, [userId, queryClient]);

  return useQuery<AppNotification[]>({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "notifications"),
        where("to_user_id", "==", userId),
        orderBy("created_at", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AppNotification[];
    },
    enabled: !!userId,
    staleTime: 0,
  });
}

// Mark a notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const q = query(
        collection(db, "notifications"),
        where("to_user_id", "==", userId),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) => updateDoc(d.ref, { read: true }))
      );
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}
