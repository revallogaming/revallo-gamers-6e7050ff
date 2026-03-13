"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LandingPage } from "@/components/landing/LandingPage";

// The landing page is the "Superpower" pivot.
// We sell the idea before showing the platform to new users.
export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/feed");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null; // Or a loading spinner
  }

  return <LandingPage />;
}
