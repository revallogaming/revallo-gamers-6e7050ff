"use client";

import React from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import {
  Film,
  Users,
  Trophy,
  User,
  Settings,
  Smile,
  LogOut,
  Shield,
  LayoutDashboard,
  Gamepad2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/feed",
    label: "Feed",
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: "/apostados",
    label: "Apostados FF",
    icon: <Zap size={20} />,
  },
  {
    href: "/tournaments",
    label: "Campeonatos",
    icon: <Trophy size={20} />,
  },
  {
    href: "/communities",
    label: "Comunidades",
    icon: <Users size={20} />,
  },
  {
    href: "/lfg",
    label: "LFG",
    icon: <Smile size={20} />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile, hasRole, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed" || pathname === "/";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside
      className="hidden lg:flex w-[130px] flex-col h-screen sticky top-0 shrink-0 z-40 select-none bg-[#0B0B0F]/80 backdrop-blur-3xl"
      style={{
        borderRight: "1px solid rgba(143, 132, 217, 0.1)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center shrink-0 pt-4 pb-2">
        <Link href="/" className="flex items-center gap-2 group">
          <NextImage 
            src="/revallo-logo-hd.svg" 
            alt="Revallo" 
            width={80} 
            height={32} 
            className="h-8 w-auto" 
            priority 
          />
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 pt-6 space-y-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all duration-300 group relative",
                active ? "text-white bg-revallo-purple/10 shadow-[inset_0_0_20px_rgba(143,132,217,0.1)]" : "text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]",
              )}
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full"
                  style={{
                    background: "#8F84D9",
                    boxShadow: "0 0 15px rgba(143, 132, 217, 0.5)",
                  }}
                />
              )}
              <div
                className={cn(
                  "shrink-0 transition-transform group-hover:scale-110 duration-500",
                  active ? "text-primary shadow-glow-sm" : "",
                )}
              >
                {icon}
              </div>
              <span
                className={cn(
                  "text-[9px] font-black uppercase italic tracking-[0.2em]",
                  active ? "text-white" : "text-gray-600",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {hasRole("admin") && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all duration-300 group relative",
              isActive("/admin") ? "text-white bg-white/5" : "text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]",
            )}
          >
            {isActive("/admin") && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "var(--shadow-primary)",
                }}
              />
            )}
            <div
              className={cn(
                "shrink-0 transition-transform group-hover:scale-110",
                isActive("/admin") ? "text-primary" : "",
              )}
            >
              <Shield size={20} />
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase italic tracking-[0.2em]",
                isActive("/admin") ? "text-white" : "text-gray-600",
              )}
            >
              Admin
            </span>
          </Link>
        )}
      </nav>

      {/* User Card */}
      <div className="px-3 pb-6 shrink-0">
        {user ? (
          <div
            className="rounded-2xl p-2 flex flex-col items-center gap-3 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:bg-white/[0.04]"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <Link href="/profile" className="relative z-10">
              <Avatar
                className="h-12 w-12 shrink-0 border-2 border-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-glow-sm"
              >
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[12px] font-black italic text-primary bg-primary/10">
                  {profile?.nickname?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="text-center w-full relative z-10">
              <p className="text-[10px] font-black text-primary italic tracking-widest leading-none">
                {profile?.credits || 0} CR
              </p>
            </div>

            <div className="flex items-center justify-around w-full relative z-10 pt-2 border-t border-white/5">
              <Link href="/profile?tab=settings" className="text-gray-600 hover:text-white transition-colors p-1.5" title="Configurações">
                <Settings size={14} />
              </Link>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-red-500 transition-colors p-1.5"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-[10px] font-black text-white transition-all hover:opacity-90 relative overflow-hidden group"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-primary)",
            }}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <User size={18} className="relative z-10" />
            <span className="uppercase italic tracking-widest relative z-10">Entrar</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
