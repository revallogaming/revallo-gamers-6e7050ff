"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * /my-tournaments redirects to the tournament dashboard which already
 * shows tournaments created by and joined by the user.
 */
export default function MyTournamentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
    } else {
      router.replace("/organizer");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
