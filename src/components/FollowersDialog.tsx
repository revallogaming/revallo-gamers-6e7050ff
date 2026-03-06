"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}

export const FollowersDialog = ({ open, onOpenChange, userId, type }: FollowersDialogProps) => {
  const { data: users, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: async () => {
      if (type === "followers") {
        // Get users who follow this user
        const q = query(
          collection(db, "followers"),
          where("following_id", "==", userId)
        );
        const snapshot = await getDocs(q);
        const followerIds = snapshot.docs.map((d) => d.data().follower_id as string);
        if (followerIds.length === 0) return [];

        // Fetch profiles for each follower
        const profiles = await Promise.all(
          followerIds.map(async (id) => {
            const profileDoc = await getDoc(doc(db, "profiles", id));
            if (!profileDoc.exists()) return null;
            return { id: profileDoc.id, ...profileDoc.data() };
          })
        );
        return profiles.filter(Boolean);
      } else {
        // Get users this user follows
        const q = query(
          collection(db, "followers"),
          where("follower_id", "==", userId)
        );
        const snapshot = await getDocs(q);
        const followingIds = snapshot.docs.map((d) => d.data().following_id as string);
        if (followingIds.length === 0) return [];

        // Fetch profiles for each following
        const profiles = await Promise.all(
          followingIds.map(async (id) => {
            const profileDoc = await getDoc(doc(db, "profiles", id));
            if (!profileDoc.exists()) return null;
            return { id: profileDoc.id, ...profileDoc.data() };
          })
        );
        return profiles.filter(Boolean);
      }
    },
    enabled: open && !!userId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0B1A] border-white/10">
        <DialogHeader>
          <DialogTitle className="font-black italic uppercase tracking-tighter text-white">
            {type === "followers" ? "Seguidores" : "Seguindo"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                  <Skeleton className="h-4 w-32 bg-white/5" />
                </div>
              ))}
            </>
          ) : users && users.length > 0 ? (
            users.map((user: any) => (
              <Link
                key={user.id}
                href={`/perfil/${user.nickname || user.id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors"
              >
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-sm italic">
                    {user.nickname?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-white flex items-center gap-2">
                  {user.nickname}
                  {user.is_highlighted && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8 font-black italic uppercase text-[10px] tracking-widest">
              {type === "followers"
                ? "Nenhum seguidor ainda"
                : "Não está seguindo ninguém ainda"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
