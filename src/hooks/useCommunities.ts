import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  limit,
  deleteDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Community, CommunityMember, Channel, Message, Profile } from "@/types";
import { useEffect, useState } from "react";

export function useUserMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-memberships", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "community_members"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().community_id as string);
    },
    enabled: !!userId,
  });
}

export function useUserTournamentHubs(userId: string | undefined) {
  const { data: memberships } = useUserMemberships(userId);

  return useQuery({
    queryKey: ["user-tournament-hubs", userId, memberships],
    queryFn: async () => {
      if (!userId) return [];
      
      // Fetch communities to filter. 
      // We check for both type 'tournament' AND any that might not have the type yet but have a tournament_id.
      const q = query(collection(db, "communities"), limit(200));
      const snapshot = await getDocs(q);
      const allHubs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Community,
      );
      
      const userHubIds = memberships || [];

      const filtered = allHubs.filter(hub => {
        const name = (hub.name || "").toLowerCase();
        const isTournamentType = hub.type === 'tournament' || !!hub.tournament_id || name.startsWith('hub:');
        const isUserInvolved = (userHubIds && userHubIds.includes(hub.id)) || (hub.owner_id === userId);
        return isTournamentType && isUserInvolved;
      });

      // ── Client-side deduplication by tournament_id OR normalized name ───
      // Legacy hubs may not have tournament_id — deduplicate by normalized name as fallback
      // so 5 hubs named "Hub: TSTSES" collapse into 1 entry.
      const seen = new Set<string>();
      return filtered.filter(hub => {
        // Prefer tournament_id as the canonical key; fall back to normalized name
        const normalizedName = (hub.name || '').toLowerCase().trim();
        const key = hub.tournament_id || normalizedName;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!userId,
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    queryFn: async () => {
      // No orderBy — avoids excluding docs without created_at field
      const q = query(collection(db, "communities"), limit(200));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Community,
      );
      // Filter out tournament-specific hubs from the general social list.
      // We are strict: it must be explicitly 'social' OR not look like a generated tournament hub.
      const socialHubs = docs.filter(doc => {
        if (doc.type === 'social') return true;
        if (doc.type === 'tournament' || !!doc.tournament_id) return false;
        // Fallback for older hubs: if it starts with "Hub: ", it's likely a tournament hub
        const name = (doc.name || "").toLowerCase();
        return !name.startsWith('hub:');
      });
      
      // Sort client-side: most recently created first, missing date goes last
      return socialHubs.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0;
        return tb - ta;
      });
    },
  });
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: ["community", id],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    queryFn: async () => {
      const docRef = doc(db, "communities", id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) throw new Error("Comunidade não encontrada");
      return { id: snapshot.id, ...snapshot.data() } as Community;
    },
    enabled: !!id,
  });
}

export function useCommunityMembers(communityId: string) {
  return useQuery({
    queryKey: ["community-members", communityId],
    queryFn: async () => {
      const q = query(
        collection(db, "community_members"),
        where("community_id", "==", communityId),
      );
      const snapshot = await getDocs(q);
      const members = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as CommunityMember,
      );

      // Fetch user profiles for members
      const membersWithProfiles = await Promise.all(
        members.map(async (m) => {
          const userDoc = await getDoc(doc(db, "profiles", m.user_id));
          return {
            ...m,
            user: userDoc.exists()
              ? ({ id: userDoc.id, ...userDoc.data() } as Profile)
              : undefined,
          };
        }),
      );

      return membersWithProfiles;
    },
    enabled: !!communityId,
  });
}

export function useChannels(communityId: string) {
  return useQuery({
    queryKey: ["channels", communityId],
    queryFn: async () => {
      const q = query(
        collection(db, "channels"),
        where("community_id", "==", communityId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Channel,
      );
    },
    enabled: !!communityId,
  });
}

export function useMessages(channelId: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;

    const q = query(
      collection(db, "messages"),
      where("channel_id", "==", channelId),
      orderBy("created_at", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAt = data.created_at;
        
        // Handle Firestore Timestamp
        if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
          createdAt = createdAt.toDate().toISOString();
        }

        return { 
          id: doc.id, 
          ...data,
          created_at: createdAt || new Date().toISOString()
        } as Message;
      });

      const now = new Date().toISOString();

      // Fetch profile for each message
      const msgsWithProfiles = await Promise.all(
        msgs.reverse().map(async (m) => {
          // Client-side filtering for temporary messages
          if (m.expires_at && m.expires_at < now) return null;

          // Client-side filtering for "Delete for me"
          if (userId && m.deleted_for?.includes(userId)) return null;

          const userDoc = await getDoc(doc(db, "profiles", m.user_id));
          return {
            ...m,
            user: userDoc.exists()
              ? ({ id: userDoc.id, ...userDoc.data() } as Profile)
              : undefined,
          };
        }),
      );

      setMessages(msgsWithProfiles.filter(m => m !== null) as Message[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [channelId, userId]);

  return { messages, loading };
}

export function useCommunityActions() {
  const queryClient = useQueryClient();

  const createCommunity = useMutation({
    mutationFn: async ({
      name,
      description,
      game,
      banner_url,
      userId,
      type = 'social',
      tournamentId,
    }: {
      name: string;
      description: string;
      game: string | null;
      banner_url: string | null;
      userId: string;
      type?: 'social' | 'tournament';
      tournamentId?: string;
    }) => {
      // 1. Create the community
      const communityRef = await addDoc(collection(db, "communities"), {
        name,
        description,
        game: game || null,
        banner_url: banner_url || null,
        owner_id: userId,
        member_count: 1,
        status: "new",
        type,
        tournament_id: tournamentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 2. Create default channel
      await addDoc(collection(db, "channels"), {
        community_id: communityRef.id,
        name: "geral",
        type: "text",
        created_at: new Date().toISOString(),
      });

      // 3. Add owner as member
      await setDoc(
        doc(db, "community_members", `${communityRef.id}_${userId}`),
        {
          community_id: communityRef.id,
          user_id: userId,
          role: "owner",
          joined_at: new Date().toISOString(),
        },
      );

      return communityRef.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["channels", id] });
    },
  });

  const joinCommunity = useMutation({
    mutationFn: async ({
      communityId,
      userId,
    }: {
      communityId: string;
      userId: string;
    }) => {
      const memberId = `${communityId}_${userId}`;
      const memberRef = doc(db, "community_members", memberId);
      const memberSnap = await getDoc(memberRef);

      // Already a member — do nothing to avoid double-counting
      if (memberSnap.exists()) return;

      await setDoc(memberRef, {
        community_id: communityId,
        user_id: userId,
        role: "member",
        joined_at: new Date().toISOString(),
      });

      // Safely increment member count
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);
      if (communitySnap.exists()) {
        const currentCount = communitySnap.data().member_count || 0;
        await updateDoc(communityRef, { member_count: currentCount + 1 });
      }
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["user-memberships"] });
    },
  });

  const leaveCommunity = useMutation({
    mutationFn: async ({
      communityId,
      userId,
    }: {
      communityId: string;
      userId: string;
    }) => {
      const memberId = `${communityId}_${userId}`;
      await deleteDoc(doc(db, "community_members", memberId));

      // Update member count
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);
      if (communitySnap.exists()) {
        const currentCount = communitySnap.data().member_count || 1;
        await updateDoc(communityRef, { member_count: Math.max(0, currentCount - 1) });
      }
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({
        queryKey: ["community-members", communityId],
      });
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  const createChannel = useMutation({
    mutationFn: async ({
      communityId,
      name,
      type = "text",
    }: {
      communityId: string;
      name: string;
      type?: "text" | "voice" | "announcement";
    }) => {
      await addDoc(collection(db, "channels"), {
        community_id: communityId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type,
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["channels", communityId] });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (channelId: string) => {
      await deleteDoc(doc(db, "channels", channelId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({
      channelId,
      userId,
      content,
      type = "text",
      audioUrl = null,
      expiresAt = null,
    }: {
      channelId: string;
      userId: string;
      content: string;
      type?: "text" | "audio" | "image";
      audioUrl?: string | null;
      expiresAt?: string | null;
    }) => {
      await addDoc(collection(db, "messages"), {
        channel_id: channelId,
        user_id: userId,
        content: content,
        type: type,
        audio_url: audioUrl,
        expires_at: expiresAt || null,
        created_at: serverTimestamp(),
        deleted_for: [],
      });
    },
  });

  const deleteMessageForMe = useMutation({
    mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }) => {
      const msgRef = doc(db, "messages", messageId);
      const msgSnap = await getDoc(msgRef);
      if (msgSnap.exists()) {
        const deletedFor = msgSnap.data().deleted_for || [];
        if (!deletedFor.includes(userId)) {
          await updateDoc(msgRef, {
            deleted_for: [...deletedFor, userId]
          });
        }
      }
    },
  });

  const toggleTemporaryMessages = useMutation({
    mutationFn: async ({ channelId, enabled }: { channelId: string; enabled: boolean }) => {
      await updateDoc(doc(db, "channels", channelId), {
        is_temporary: enabled
      });
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    }
  });

  const updateCommunity = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      banner_url,
    }: {
      id: string;
      name: string;
      description: string;
      banner_url: string | null;
    }) => {
      await updateDoc(doc(db, "communities", id), {
        name,
        description,
        banner_url,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["community", id] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  // ─── Admin Mutations ───────────────────────────────────────────────────────

  /** Remove a member from the community (kick) */
  const kickMember = useMutation({
    mutationFn: async ({
      communityId,
      userId,
    }: {
      communityId: string;
      userId: string;
    }) => {
      const memberId = `${communityId}_${userId}`;
      await deleteDoc(doc(db, "community_members", memberId));

      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);
      if (communitySnap.exists()) {
        const currentCount = communitySnap.data().member_count || 1;
        await updateDoc(communityRef, { member_count: Math.max(1, currentCount - 1) });
      }
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
    },
  });

  /** Promote or demote a member between "member" and "moderator" */
  const updateMemberRole = useMutation({
    mutationFn: async ({
      communityId,
      userId,
      role,
    }: {
      communityId: string;
      userId: string;
      role: "member" | "moderator";
    }) => {
      const memberId = `${communityId}_${userId}`;
      await updateDoc(doc(db, "community_members", memberId), { role });
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
    },
  });

  /** Mute or unmute a member (blocks them from sending messages) */
  const muteMember = useMutation({
    mutationFn: async ({
      communityId,
      userId,
      muted,
    }: {
      communityId: string;
      userId: string;
      muted: boolean;
    }) => {
      const memberId = `${communityId}_${userId}`;
      await updateDoc(doc(db, "community_members", memberId), { muted });
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
    },
  });

  /** Delete the entire community and all its sub-documents */
  const deleteCommunity = useMutation({
    mutationFn: async (communityId: string) => {
      // Delete all channels
      const channelsSnap = await getDocs(
        query(collection(db, "channels"), where("community_id", "==", communityId))
      );
      await Promise.all(channelsSnap.docs.map(d => deleteDoc(d.ref)));

      // Delete all members
      const membersSnap = await getDocs(
        query(collection(db, "community_members"), where("community_id", "==", communityId))
      );
      await Promise.all(membersSnap.docs.map(d => deleteDoc(d.ref)));

      // Delete the community itself
      await deleteDoc(doc(db, "communities", communityId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });

  /** Clear all messages in a channel */
  const clearChannelMessages = useMutation({
    mutationFn: async (channelId: string) => {
      const messagesSnap = await getDocs(
        query(collection(db, "messages"), where("channel_id", "==", channelId))
      );
      await Promise.all(messagesSnap.docs.map(m => deleteDoc(m.ref)));
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
    },
  });

  return { 
    createCommunity, 
    updateCommunity, 
    joinCommunity, 
    leaveCommunity,
    sendMessage,
    createChannel,
    deleteChannel,
    kickMember,
    updateMemberRole,
    muteMember,
    deleteCommunity,
    clearChannelMessages,
    deleteMessageForMe,
    toggleTemporaryMessages,
  };
}
