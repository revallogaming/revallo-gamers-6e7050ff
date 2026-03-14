"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RefreshCw,
  Shield,
  Users,
  Trophy,
  Gamepad2,
  Coins,
  BarChart3,
  ArrowLeft,
  Flag,
} from "lucide-react";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminTournaments } from "@/components/admin/AdminTournaments";
import { AdminMiniTournaments } from "@/components/admin/AdminMiniTournaments";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminWithdrawals } from "@/components/admin/AdminWithdrawals";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

interface UserWithCredits {
  id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  roles: string[];
  is_banned: boolean;
  ban_reason: string | null;
  verification_type?: "none" | "admin" | "influencer" | "verified";
  admin_access_key?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);

  useEffect(() => {
    const key = sessionStorage.getItem("admin_access_key");
    const uid = sessionStorage.getItem("admin_uid");
    
    if (!key || !uid) {
      router.replace("/admin/login");
    } else {
      setIsAuthorized(true);
      setAdminUid(uid);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const key = sessionStorage.getItem("admin_access_key");
      const response = await fetch("/api/admin/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_users", key }),
        cache: "no-store"
      });

      const result = await response.json();
      if (response.ok) {
        setUsers(result.users);
      } else {
        toast.error(result.error || "Erro ao carregar usuários");
        if (response.status === 401 || response.status === 403) {
           sessionStorage.removeItem("admin_access_key");
           router.replace("/admin/login");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro técnico ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#05040a] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 font-sans">
      <Header />

      <main className="container py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-glow-sm">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">
              Painel de <span className="text-primary">Administração</span>
            </h1>
            <p className="text-muted-foreground font-medium italic">
              Gerencie usuários, torneios, créditos e moderação
            </p>
          </div>
          <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase text-gray-500">Sessão Autorizada via Chave</p>
            <p className="text-[11px] font-mono text-primary truncate max-w-[150px]">{adminUid || "Admin"}</p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Torneios</span>
            </TabsTrigger>
            <TabsTrigger value="mini" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Mini</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Denúncias</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Saques</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <AdminStats />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers
              users={users}
              isLoading={isLoading}
              onRefresh={fetchUsers}
            />
          </TabsContent>

          <TabsContent value="tournaments">
            <AdminTournaments />
          </TabsContent>

          <TabsContent value="mini">
            <AdminMiniTournaments />
          </TabsContent>

          <TabsContent value="transactions">
            <AdminTransactions />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>

          <TabsContent value="withdrawals">
            <AdminWithdrawals />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
