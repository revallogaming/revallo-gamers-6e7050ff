import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Shield, Users, Trophy, Gamepad2, Coins, BarChart3, ArrowLeft } from 'lucide-react';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminTournaments } from '@/components/admin/AdminTournaments';
import { AdminMiniTournaments } from '@/components/admin/AdminMiniTournaments';
import { AdminTransactions } from '@/components/admin/AdminTransactions';

interface UserWithCredits {
  id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  roles: string[];
  is_banned: boolean;
  ban_reason: string | null;
}

export default function Admin() {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !hasRole('admin'))) {
      navigate('/');
    }
  }, [user, loading, hasRole, navigate]);

  useEffect(() => {
    if (user && hasRole('admin')) {
      fetchUsers();
    }
  }, [user, hasRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with ban info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, is_banned, ban_reason');

      if (profilesError) throw profilesError;

      // Fetch credits
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance');

      if (creditsError) throw creditsError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithCredits: UserWithCredits[] = (profiles || []).map(profile => {
        const userCredits = credits?.find(c => c.user_id === profile.id);
        const userRoles = roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        
        return {
          id: profile.id,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url,
          balance: userCredits?.balance ?? 0,
          roles: userRoles,
          is_banned: profile.is_banned || false,
          ban_reason: profile.ban_reason,
        };
      });

      setUsers(usersWithCredits);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
        </Tabs>
      </main>
    </div>
  );
}
