"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { VisitorTracker } from "@/components/VisitorTracker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Routes that should NOT show the AppSidebar (guest/public pages)
const NO_SIDEBAR_ROUTES = [
  "/",
  "/auth",
  "/auth/reset-password",
  "/termos-de-uso",
  "/politica-de-privacidade",
  "/choose-avatar",
  "/invite",
];

function shouldShowSidebar(pathname: string): boolean {
  return !NO_SIDEBAR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function RedirectGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const isPublic = NO_SIDEBAR_ROUTES.some(
        (route) => pathname === route || pathname?.startsWith(route + "/"),
      );
      if (!isPublic) {
        router.replace("/");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0E0E12]">
        <div className="h-10 w-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname || "");

  if (!showSidebar) {
    // Landing/auth pages: no sidebar, full width
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-[#0E0E12]/95 pointer-events-none z-0" />
        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RedirectGuard>
          <LayoutShell>{children}</LayoutShell>
        </RedirectGuard>
        <VisitorTracker />
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
