"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  LogOut,
  PlusCircle,
  MessageSquare,
  Film,
  Home,
  Search,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCommunities } from "@/hooks/useCommunities";

const NAV_ITEMS = [
  { icon: Home, label: "Feed", href: "/feed" },
  { icon: Trophy, label: "Torneios", href: "/tournaments" },
  { icon: Users, label: "Comunidades", href: "/communities" },
  { icon: MessageSquare, label: "Conversas", href: "/chat" },
  { icon: Search, label: "Explorar", href: "/lfg" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: communities } = useCommunities();

  const userCommunities = communities?.slice(0, 5) || [];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0A0A0C] flex flex-col h-screen sticky top-0 shrink-0 z-40">
      <div className="p-6">
        <div
          className="flex items-center gap-3 mb-10 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img src="/revallo-logo-hd.svg" alt="Revallo" className="h-10 w-auto" />
          <span className="font-black italic text-2xl uppercase tracking-tighter text-primary">
            Revallo
          </span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive
                    ? "bg-primary text-black font-black italic shadow-lg shadow-primary/10"
                    : "text-gray-500 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive
                      ? "text-black"
                      : "group-hover:scale-110 transition-transform",
                  )}
                />
                <span className="text-sm uppercase tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-12 space-y-6">
          <div>
            <div className="flex items-center justify-between px-4 mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 italic">
                Meus Espaços
              </p>
              <Link href="/communities">
                <PlusCircle className="w-4 h-4 text-gray-700 hover:text-primary transition-colors cursor-pointer" />
              </Link>
            </div>

            <div className="space-y-1">
              {userCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/communities/${community.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-gray-500 hover:text-white transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {community.banner_url ? (
                      <img
                        src={community.banner_url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        alt=""
                      />
                    ) : (
                      <span className="text-[10px] font-black italic">
                        {community.name[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold truncate">
                    {community.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {user ? (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-black italic">
                    {user.displayName?.[0] || "U"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black italic uppercase text-white truncate">
                  {user.displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[9px] font-bold text-primary uppercase">
                    Online
                  </p>
                </div>
              </div>
            </div>
            <Link href="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-white/5"
              >
                <Settings className="w-3.5 h-3.5" />
                Ver Perfil
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full justify-start h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-red-500/10 hover:text-red-500 text-gray-500"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </Button>
          </div>
        ) : (
          <Link href="/auth">
            <Button className="w-full bg-primary text-black font-black italic uppercase rounded-2xl h-14 group">
              Entrar agora
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}
