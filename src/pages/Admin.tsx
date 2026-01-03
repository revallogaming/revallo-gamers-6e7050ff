import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Plus, Minus, RefreshCw, Shield, Coins, Ban, Trash2, UserX, CheckCircle, Edit3, Crown, UserMinus } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({});
  
  // Dialogs
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setCreditsDialogOpen, setSetCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithCredits | null>(null);
  const [banReason, setBanReason] = useState('');
  const [newCreditAmount, setNewCreditAmount] = useState('');

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

  const updateCredits = async (userId: string, amount: number) => {
    try {
      const { data, error } = await supabase.rpc('admin_add_credits', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) throw error;

      toast.success(`${amount > 0 ? 'Adicionados' : 'Removidos'} ${Math.abs(amount)} créditos`);
      fetchUsers();
      setCreditAmounts(prev => ({ ...prev, [userId]: '' }));
    } catch (error: any) {
      console.error('Error updating credits:', error);
      toast.error(error.message || 'Erro ao atualizar créditos');
    }
  };

  const handleAddAdminRole = async (userId: string, nickname: string) => {
    try {
      const { error } = await supabase.rpc('admin_add_role', {
        p_user_id: userId,
        p_role: 'admin',
      });

      if (error) throw error;

      toast.success(`${nickname} agora é administrador`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding admin role:', error);
      toast.error(error.message || 'Erro ao promover a admin');
    }
  };

  const handleRemoveAdminRole = async (userId: string, nickname: string) => {
    try {
      const { error } = await supabase.rpc('admin_remove_role', {
        p_user_id: userId,
        p_role: 'admin',
      });

      if (error) throw error;

      toast.success(`${nickname} não é mais administrador`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error removing admin role:', error);
      toast.error(error.message || 'Erro ao remover admin');
    }
  };

  const handleSetCredits = async () => {
    if (!selectedUser) return;
    
    try {
      const amount = parseInt(newCreditAmount);
      if (isNaN(amount) || amount < 0) {
        toast.error('Valor inválido');
        return;
      }

      const { error } = await supabase.rpc('admin_set_credits', {
        p_user_id: selectedUser.id,
        p_amount: amount,
      });

      if (error) throw error;

      toast.success(`Créditos definidos para ${amount}`);
      setSetCreditsDialogOpen(false);
      setNewCreditAmount('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error setting credits:', error);
      toast.error(error.message || 'Erro ao definir créditos');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase.rpc('admin_toggle_ban', {
        p_user_id: selectedUser.id,
        p_ban: true,
        p_reason: banReason || null,
      });

      if (error) throw error;

      toast.success(`Usuário ${selectedUser.nickname} banido`);
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error(error.message || 'Erro ao banir usuário');
    }
  };

  const handleUnbanUser = async (userId: string, nickname: string) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_ban', {
        p_user_id: userId,
        p_ban: false,
      });

      if (error) throw error;

      toast.success(`Usuário ${nickname} desbanido`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error(error.message || 'Erro ao desbanir usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: selectedUser.id,
      });

      if (error) throw error;

      toast.success(`Usuário ${selectedUser.nickname} removido permanentemente`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao remover usuário');
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
              Gerencie usuários, créditos e moderação
            </p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription>
                  Gerencie créditos, banimentos e contas
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Admin</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-center">Gerenciar Créditos</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id} className={u.is_banned ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-bold ${
                              u.is_banned ? 'bg-destructive' : 'bg-gradient-primary'
                            }`}>
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
                            {u.is_banned ? (
                              <Badge variant="destructive" className="gap-1">
                                <Ban className="h-3 w-3" />
                                Banido
                              </Badge>
                            ) : (
                              u.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={role === 'admin' ? 'default' : 'secondary'}
                                  className={role === 'admin' ? 'bg-primary' : ''}
                                >
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.roles.includes('admin') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                              onClick={() => handleRemoveAdminRole(u.id, u.nickname)}
                            >
                              <UserMinus className="h-4 w-4" />
                              Remover Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleAddAdminRole(u.id, u.nickname)}
                            >
                              <Crown className="h-4 w-4" />
                              Tornar Admin
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`font-mono font-bold text-lg ${
                              u.balance >= 999999999 ? 'text-primary' : 'text-foreground'
                            }`}>
                              {formatCredits(u.balance)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewCreditAmount(u.balance.toString());
                                setSetCreditsDialogOpen(true);
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="number"
                              placeholder="Qtd"
                              value={creditAmounts[u.id] || ''}
                              onChange={(e) => setCreditAmounts(prev => ({ ...prev, [u.id]: e.target.value }))}
                              className="w-20 text-center h-9"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
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
                              className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {u.is_banned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => handleUnbanUser(u.id, u.nickname)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Desbanir
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setBanDialogOpen(true);
                                }}
                                disabled={u.roles.includes('admin')}
                              >
                                <Ban className="h-4 w-4" />
                                Banir
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={u.roles.includes('admin')}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remover
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

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <Ban className="h-5 w-5" />
              Banir Usuário
            </DialogTitle>
            <DialogDescription>
              Você está prestes a banir <strong>{selectedUser?.nickname}</strong>. 
              O usuário não poderá mais acessar a plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Motivo do banimento (opcional)</Label>
              <Textarea
                id="ban-reason"
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBanUser}
              className="gap-2"
            >
              <Ban className="h-4 w-4" />
              Confirmar Banimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" />
              Remover Conta Permanentemente
            </DialogTitle>
            <DialogDescription>
              <strong className="text-destructive">ATENÇÃO: Esta ação é irreversível!</strong>
              <br /><br />
              Você está prestes a remover permanentemente a conta de <strong>{selectedUser?.nickname}</strong>.
              Todos os dados do usuário serão apagados, incluindo:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Perfil e credenciais</li>
                <li>Créditos e transações</li>
                <li>Inscrições em torneios</li>
                <li>Torneios criados</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remover Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Credits Dialog */}
      <Dialog open={setCreditsDialogOpen} onOpenChange={setSetCreditsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Definir Créditos
            </DialogTitle>
            <DialogDescription>
              Defina o saldo de créditos de <strong>{selectedUser?.nickname}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-credits">Novo saldo de créditos</Label>
              <Input
                id="new-credits"
                type="number"
                min={0}
                placeholder="0"
                value={newCreditAmount}
                onChange={(e) => setNewCreditAmount(e.target.value)}
                className="text-lg font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Saldo atual: {formatCredits(selectedUser?.balance || 0)} créditos
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetCreditsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSetCredits}
              className="gap-2 bg-gradient-primary"
            >
              <Coins className="h-4 w-4" />
              Definir Créditos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
