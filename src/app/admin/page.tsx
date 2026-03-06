"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminTournaments } from "@/components/admin/AdminTournaments";
import { AdminMiniTournaments } from "@/components/admin/AdminMiniTournaments";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminWithdrawals } from "@/components/admin/AdminWithdrawals";

interface UserWithCredits {
  id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  roles: string[];
  is_banned: boolean;
  ban_reason: string | null;
  verification_type?: "none" | "admin" | "influencer";
}

export default function Admin() {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authorized = !!sessionStorage.getItem("admin_access_key");
    if (authorized) setIsAuthorized(true);
  }, []);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Adiel&Adryan2026@!") {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_access_key", password);
      toast.success("Acesso autorizado!");
    } else {
      toast.error("Chave de acesso inválida");
    }
  };

  useEffect(() => {
    // Only redirect if NOT loading, and either not logged in OR (is NOT authorized via password AND doesn't have admin role)
    // Actually, let's simplify: if logged in, let them reach the password gate.
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isAuthorized) {
      fetchUsers();
    }
  }, [user, isAuthorized]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const profilesSnapshot = await getDocs(collection(db, "profiles"));
      const profiles = profilesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch credits
      const creditsSnapshot = await getDocs(collection(db, "user_credits"));
      const credits = creditsSnapshot.docs.map((doc) => doc.data());

      // Fetch roles
      const rolesSnapshot = await getDocs(collection(db, "user_roles"));
      const roles = rolesSnapshot.docs.map((doc) => doc.data());

      // Combine data
      const usersWithCredits: UserWithCredits[] = profiles.map(
        (profile: Record<string, unknown>) => {
          const userCredits = credits?.find(
            (c: Record<string, unknown>) => c.user_id === profile.id,
          );
          const userRoles =
            roles
              ?.filter((r: Record<string, unknown>) => r.user_id === profile.id)
              .map((r: Record<string, unknown>) => r.role as string) || [];

          return {
            id: profile.id as string,
            nickname: profile.nickname as string,
            avatar_url: (profile.avatar_url as string | null) ?? null,
            balance: (userCredits?.balance as number) ?? 0,
            roles: userRoles,
            is_banned: (profile.is_banned as boolean) || false,
            ban_reason: (profile.ban_reason as string | null) ?? null,
            verification_type: (profile.verification_type as any) || "none",
          };
        },
      );

      setUsers(usersWithCredits);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authorized by password, always show gate (even for db admins)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="w-full max-w-sm p-8 rounded-[32px] bg-white/2 border border-white/5 backdrop-blur-xl relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="text-primary h-8 w-8" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Painel <span className="text-primary">Admin</span></h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Área Restrita • Insira a Chave de Acesso</p>
          </div>

          <form onSubmit={handleAuthorize} className="space-y-4">
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 h-14 rounded-2xl text-center font-black tracking-[0.3em] focus-visible:ring-primary/40 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Button 
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              Autorizar Acesso
            </Button>
          </form>

          <Link href="/" className="flex items-center justify-center gap-2 mt-8 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors italic">
            <ArrowLeft size={12} />
            Voltar para a Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Painel de Administração
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários, torneios, créditos e moderação
            </p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estatísticas</span>
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
