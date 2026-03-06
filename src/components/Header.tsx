"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevalloLogo } from "@/components/RevalloLogo";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, profile, hasRole, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = hasRole("admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#080710]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <RevalloLogo size={32} />
          <span className="font-black italic text-xl uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
            REVALLO
          </span>
        </Link>

        {/* Desktop Right Side */}
        <nav className="hidden md:flex items-center">
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 gap-2 font-black uppercase italic text-[10px] tracking-widest"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-14 px-4 hover:bg-white/5 flex items-center gap-4 transition-all group rounded-2xl border border-white/10 bg-white/2"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-colors shadow-lg shadow-primary/10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-[10px] font-black text-primary italic">
                        {profile?.nickname?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block pr-1">
                      <p className="text-[13px] font-black text-white italic leading-none tracking-tight">
                        {profile?.nickname || "Player"}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 truncate max-w-[120px] mt-1.5 opacity-60">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500 group-hover:text-white transition-colors ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[220px] bg-[#0D0B1A] border-white/5 text-white rounded-[24px] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="px-4 py-4 mb-2 flex flex-col gap-1 border-b border-white/5">
                    <p className="text-[13px] font-black italic uppercase tracking-tighter">
                      {profile?.nickname || "Player"}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 truncate opacity-50">
                      {user.email}
                    </p>
                  </div>

                  <DropdownMenuItem
                    className="rounded-xl px-4 py-3 text-gray-400 hover:bg-white/5 cursor-pointer text-xs font-black uppercase italic tracking-widest group"
                    onClick={() => router.push("/profile")}
                  >
                    <User size={16} className="mr-3 text-gray-600 group-hover:text-primary transition-colors" /> Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl px-4 py-3 text-gray-400 hover:bg-white/5 cursor-pointer text-xs font-black uppercase italic tracking-widest group"
                    onClick={() => router.push("/dashboard/financeiro")}
                  >
                    <Wallet size={16} className="mr-3 text-gray-600 group-hover:text-primary transition-colors" /> Financeiro
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5 my-2" />

                  <DropdownMenuItem
                    className="rounded-xl px-4 py-3 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 cursor-pointer text-xs font-black uppercase italic tracking-widest"
                    onClick={signOut}
                  >
                    <LogOut size={16} className="mr-3" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest text-[11px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                Entrar
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#080710] py-6 px-4 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-6">
            {user ? (
              <div className="flex flex-col gap-6">
                <Link
                  href="/profile"
                  className="text-sm font-black uppercase italic tracking-widest text-white flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={16} className="text-primary" /> Meu Perfil
                </Link>
                <Link
                  href="/dashboard/financeiro"
                  className="text-sm font-black uppercase italic tracking-widest text-white flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Wallet size={16} className="text-primary" /> Financeiro
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-black uppercase italic tracking-widest text-red-500 flex items-center gap-3"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest text-xs h-12 rounded-2xl">
                  Entrar na Plataforma
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
