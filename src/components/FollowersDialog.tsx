import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

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
        const { data, error } = await supabase
          .from("followers")
          .select("follower_id, created_at")
          .eq("following_id", userId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Fetch profiles for each follower
        const userIds = data.map(f => f.follower_id);
        if (userIds.length === 0) return [];
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nickname, avatar_url, is_highlighted")
          .in("id", userIds);
        
        if (profilesError) throw profilesError;
        return profiles;
      } else {
        // Get users this user follows
        const { data, error } = await supabase
          .from("followers")
          .select("following_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Fetch profiles for each following
        const userIds = data.map(f => f.following_id);
        if (userIds.length === 0) return [];
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nickname, avatar_url, is_highlighted")
          .in("id", userIds);
        
        if (profilesError) throw profilesError;
        return profiles;
      }
    },
    enabled: open && !!userId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "followers" ? "Seguidores" : "Seguindo"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.nickname?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground flex items-center gap-2">
                  {user.nickname}
                  {user.is_highlighted && (
                    <Star className="h-4 w-4 text-accent fill-accent" />
                  )}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
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
