"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";

const queryClient = new QueryClient();

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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[#010001]/995 pointer-events-none z-0" />
        <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
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
        <LayoutShell>{children}</LayoutShell>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
