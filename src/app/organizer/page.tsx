"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * /organizer redirects authenticated users to the organizer tournament dashboard.
 * Unauthenticated users are sent to /auth.
 */
export default function OrganizerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
    } else {
      router.replace("/dashboard/torneios");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
