import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Minus, RefreshCw, Shield, Coins } from 'lucide-react';

interface UserWithCredits {
  id: string;
  nickname: string;
  avatar_url: string | null;
  balance: number;
  roles: string[];
}

export default function Admin() {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({});

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
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url');

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

  const updateCredits = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) throw error;

      toast.success(`${amount > 0 ? 'Adicionados' : 'Removidos'} ${Math.abs(amount)} créditos`);
      fetchUsers();
      setCreditAmounts(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Erro ao atualizar créditos');
    }
  };

  const filteredUsers = users.filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCredits = (balance: number) => {
    if (balance >= 999999999) return '∞';
    return balance.toLocaleString('pt-BR');
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
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Painel de Administração
            </h1>
            <p className="text-muted-foreground">
              Gerencie créditos e usuários da plataforma
            </p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Gerenciar Créditos
                </CardTitle>
                <CardDescription>
                  Adicione ou remova créditos dos usuários
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={fetchUsers}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                              {u.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{u.nickname}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {u.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === 'admin' ? 'default' : 'secondary'}
                                className={role === 'admin' ? 'bg-primary' : ''}
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono font-bold text-lg ${
                            u.balance >= 999999999 ? 'text-primary' : 'text-foreground'
                          }`}>
                            {formatCredits(u.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              placeholder="Qtd"
                              value={creditAmounts[u.id] || ''}
                              onChange={(e) => setCreditAmounts(prev => ({ ...prev, [u.id]: e.target.value }))}
                              className="w-24 text-center"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={() => {
                                const amount = parseInt(creditAmounts[u.id] || '0');
                                if (amount > 0) updateCredits(u.id, amount);
                              }}
                              disabled={!creditAmounts[u.id] || parseInt(creditAmounts[u.id]) <= 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => {
                                const amount = parseInt(creditAmounts[u.id] || '0');
                                if (amount > 0) updateCredits(u.id, -amount);
                              }}
                              disabled={!creditAmounts[u.id] || parseInt(creditAmounts[u.id]) <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
