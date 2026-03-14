import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  Search, RefreshCw, Plus, Minus, Coins, Ban, Trash2, 
  UserX, CheckCircle, Edit3, Key, ShieldCheck, Users 
} from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SYSTEM_OWNER_ID = 'tjYoxEwnOAf1WmCJpWG0';

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
  created_at?: string;
}

interface AdminUsersProps {
  users: UserWithCredits[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdminUsers({ users, isLoading, onRefresh }: AdminUsersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({});
  
  // Dialogs
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setCreditsDialogOpen, setSetCreditsDialogOpen] = useState(false);
  const [adminKeyDialogOpen, setAdminKeyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithCredits | null>(null);
  const [banReason, setBanReason] = useState("");
  const [newCreditAmount, setNewCreditAmount] = useState("");
  const [newAdminKey, setNewAdminKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = users.filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCredits = (balance: number) => {
    if (balance >= 999999999) return "∞";
    return balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Desconhecido";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const callProxy = async (action: string, data: any) => {
    try {
      setIsProcessing(true);
      const key = sessionStorage.getItem("admin_access_key");
      const response = await fetch("/api/admin/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, key, data })
      });

      const result = await response.json();
      if (response.ok) {
        return { success: true, ...result };
      } else {
        toast.error(result.error || "Erro ao realizar ação");
        return { success: false };
      }
    } catch (e) {
      toast.error("Erro técnico na comunicação com o servidor");
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateVerification = async (userId: string, type: string) => {
    const res = await callProxy("update_verification", { vUserId: userId, vType: type });
    if (res.success) {
      toast.success("Verificação atualizada");
      onRefresh();
    }
  };

  const handleUpdateCredits = async (userId: string, amount: number) => {
    const res = await callProxy("update_credits", { 
        userId, 
        amount: parseFloat(amount.toString()), 
        type: amount > 0 ? "admin_add" : "admin_remove",
        description: "Ajuste manual via Painel"
    });
    if (res.success) {
      toast.success("Saldo atualizado");
      onRefresh();
      setCreditAmounts(prev => ({ ...prev, [userId]: "" }));
    }
  };

  const handleSetCredits = async () => {
    if (!selectedUser) return;
    const amount = parseFloat(newCreditAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Valor inválido");
      return;
    }
    const res = await callProxy("set_credits", { userId: selectedUser.id, amount });
    if (res.success) {
      toast.success("Saldo definido");
      setSetCreditsDialogOpen(false);
      onRefresh();
    }
  };

  const handleInputBlur = (value: string, setter: (val: string) => void) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setter(parsed.toFixed(2));
    }
  };

  const handleSetAdminKey = async () => {
    if (!selectedUser || !newAdminKey) return;
    const res = await callProxy("add_admin_role", { aUserId: selectedUser.id, aKey: newAdminKey });
    if (res.success) {
      toast.success("Chave de acesso definida");
      setAdminKeyDialogOpen(false);
      onRefresh();
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    const res = await callProxy("add_admin_role", { aUserId: userId, aKey: "" }); // Key will be empty initially
    if (res.success) {
      toast.success("Promovido a Staff. Defina uma chave para acesso.");
      onRefresh();
    }
  };

  const handleRemoveAdminRole = async (userId: string) => {
    const res = await callProxy("remove_admin_role", { rUserId: userId });
    if (res.success) {
      toast.success("Cargo removido");
      onRefresh();
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    const res = await callProxy("toggle_ban", { bUserId: selectedUser.id, isBanned: true, reason: banReason });
    if (res.success) {
      toast.success("Usuário banido");
      setBanDialogOpen(false);
      onRefresh();
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const res = await callProxy("toggle_ban", { bUserId: userId, isBanned: false });
    if (res.success) {
      toast.success("Usuário desbanido");
      onRefresh();
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const res = await callProxy("delete_user", { dUserId: selectedUser.id });
    if (res.success) {
      toast.success("Usuário removido permanentemente");
      setDeleteDialogOpen(false);
      onRefresh();
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Gerencie créditos, banimentos e contas via Proxy API
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 border-revallo-purple/50 bg-revallo-purple/5 focus:border-revallo-purple/80 focus:ring-revallo-highlight/60 rounded-xl transition-all"
                />
              </div>
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={isProcessing}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-[24px] border border-white/5 overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-[#0B0B0F]/90 backdrop-blur-md z-30 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="py-4 text-[10px] font-black uppercase italic tracking-widest text-gray-500">Usuário & Identidade</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase italic tracking-widest text-gray-500">Privilégios & Status</TableHead>
                  <TableHead className="py-4 text-right text-[10px] font-black uppercase italic tracking-widest text-gray-500">Balanço Atual</TableHead>
                  <TableHead className="py-4 text-center text-[10px] font-black uppercase italic tracking-widest text-gray-500">Ajuste Rápido</TableHead>
                  <TableHead className="py-4 text-right text-[10px] font-black uppercase italic tracking-widest text-gray-500">Gestão de Conta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
                        <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-gray-600">Sincronizando com Proxy...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                       <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-gray-600">Nenhum jogador encontrado na rede</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className={cn("group border-white/[0.03] transition-colors hover:bg-white/[0.02]", u.is_banned ? "bg-red-500/[0.02]" : "")}>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                            <div className={cn(
                                "h-12 w-12 rounded-[18px] flex items-center justify-center text-white font-black italic text-lg shadow-xl relative overflow-hidden",
                                u.is_banned ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-gradient-to-br from-primary to-primary/40"
                              )}>
                                {u.nickname.charAt(0).toUpperCase()}
                                {!u.is_banned && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                            {u.is_banned && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-[#0B0B0F] flex items-center justify-center animate-pulse">
                                    <Ban size={8} className="text-white" />
                                </div>
                            )}
                           </div>

                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white italic text-base tracking-tighter uppercase">{u.nickname}</p>
                              <VerificationBadge type={u.verification_type} size="sm" />
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest">
                                <span className="text-gray-500 font-mono uppercase opacity-60">ID: {u.id.slice(0, 10)}...</span>
                                <span className="h-1 w-1 rounded-full bg-white/10" />
                                <span className="text-primary/70 italic">Criado: {formatDate(u.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex gap-2 flex-wrap">
                          {u.is_banned ? (
                            <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-500 text-[9px] font-black italic uppercase tracking-widest px-2.5 py-1">
                               Ban Total
                            </Badge>
                          ) : (
                            <>
                              {u.roles.includes("admin") && (
                                <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-[9px] font-black italic uppercase tracking-widest px-2.5 py-1 gap-1.5 flex items-center">
                                  <ShieldCheck className="h-3 w-3" /> Staff
                                </Badge>
                              )}
                              {u.roles.filter(r => r !== "admin").map((role) => (
                                <Badge key={role} variant="outline" className="bg-white/5 border-white/10 text-gray-400 text-[9px] font-black italic uppercase tracking-widest px-2.5 py-1">
                                    {role}
                                </Badge>
                              ))}
                              {u.roles.length === 0 && (
                                <Badge variant="outline" className="border-white/5 text-gray-600 text-[9px] font-black italic uppercase tracking-widest px-2.5 py-1">
                                    Jogador
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-5">
                        <div className="flex items-center justify-end gap-3 group/bal">
                          <div className="text-right">
                             <p className={cn(
                               "font-mono font-black italic text-xl tracking-tighter leading-none",
                               u.balance >= 999999999 ? "text-primary shadow-glow-sm" : "text-white"
                             )}>
                               {formatCredits(u.balance)}
                             </p>
                             <p className="text-[8px] font-black uppercase text-gray-600 tracking-[0.3em] mt-1.5 opacity-0 group-hover/bal:opacity-100 transition-opacity">Créditos</p>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10" 
                            onClick={() => { 
                              setSelectedUser(u); 
                              setNewCreditAmount(u.balance.toFixed(2)); 
                              setSetCreditsDialogOpen(true); 
                            }}
                          >
                            <Edit3 className="h-4 w-4 text-gray-500 hover:text-primary transition-colors" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0,00" 
                              value={creditAmounts[u.id] || ""} 
                              onChange={(e) => setCreditAmounts(prev => ({ ...prev, [u.id]: e.target.value }))} 
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const parsed = parseFloat(val);
                                  if (!isNaN(parsed)) {
                                    setCreditAmounts(prev => ({ ...prev, [u.id]: parsed.toFixed(2) }));
                                  }
                                }
                              }}
                              className="w-[110px] text-center h-10 font-mono font-bold bg-white/5 border-white/10 rounded-xl focus:ring-primary/40 focus:bg-white/[0.08] transition-all" 
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-[18px] w-8 border-white/10 hover:bg-green-500/20 hover:text-green-500 hover:border-green-500/30 rounded-md" 
                                onClick={() => handleUpdateCredits(u.id, parseFloat(creditAmounts[u.id]))} 
                                disabled={!creditAmounts[u.id] || isProcessing}
                            >
                                <Plus className="h-2 w-2" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-[18px] w-8 border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 rounded-md" 
                                onClick={() => handleUpdateCredits(u.id, -parseFloat(creditAmounts[u.id]))} 
                                disabled={!creditAmounts[u.id] || isProcessing}
                            >
                                <Minus className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-5">
                        <div className="flex items-center justify-end gap-2">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={u.id === SYSTEM_OWNER_ID || isProcessing}
                                  className={cn(
                                    "h-7 px-3 text-[9px] font-black uppercase italic tracking-widest rounded-lg border border-transparent transition-all",
                                    u.roles.includes("admin") 
                                      ? "bg-primary/20 border-primary/30 text-primary hover:bg-primary/30" 
                                      : "text-gray-500 hover:text-white hover:bg-white/5"
                                  )}
                                  onClick={() => u.roles.includes("admin") ? handleRemoveAdminRole(u.id) : handlePromoteToAdmin(u.id)}
                                >
                                  {u.roles.includes("admin") ? "Staff OK" : "Tornar Staff"}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={cn(
                                    "h-7 px-3 text-[9px] font-black uppercase italic tracking-widest rounded-lg border border-transparent transition-all",
                                    u.verification_type === "influencer" 
                                      ? "bg-[#FFD700]/20 border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
                                      : "text-gray-500 hover:text-white hover:bg-white/5"
                                  )}
                                  onClick={() => handleUpdateVerification(u.id, u.verification_type === "influencer" ? "none" : "influencer")}
                                >
                                  {u.verification_type === "influencer" ? "Dourado OK" : "Dourado"}
                                </Button>
                              </div>

                              <div className="flex items-center gap-1 justify-end">
                                {u.roles.includes("admin") && u.id !== SYSTEM_OWNER_ID && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-3 text-[9px] font-black uppercase italic tracking-widest text-primary hover:bg-primary/10 border border-primary/10 rounded-lg"
                                    onClick={() => { setSelectedUser(u); setNewAdminKey(u.admin_access_key || ""); setAdminKeyDialogOpen(true); }}
                                  >
                                    <Key className="h-3 w-3 mr-1.5" /> Chave Staff
                                  </Button>
                                )}
                                
                                {u.is_banned ? (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 px-3 text-[9px] font-black uppercase italic tracking-widest text-green-500 hover:bg-green-500/10 border border-green-500/10 rounded-lg" 
                                    onClick={() => handleUnbanUser(u.id)} 
                                    disabled={isProcessing}
                                  >
                                    Retirar Ban
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 px-3 text-[9px] font-black uppercase italic tracking-widest text-orange-500 hover:bg-orange-500/10 border border-orange-500/10 rounded-lg" 
                                    onClick={() => { setSelectedUser(u); setBanDialogOpen(true); }} 
                                    disabled={u.id === SYSTEM_OWNER_ID || isProcessing}
                                  >
                                    Banir
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 px-3 text-[9px] font-black uppercase italic tracking-widest text-red-500 hover:bg-red-500/10 border border-red-500/10 rounded-lg" 
                                  onClick={() => { setSelectedUser(u); setDeleteDialogOpen(true); }} 
                                  disabled={u.id === SYSTEM_OWNER_ID || isProcessing}
                                >
                                  <Trash2 size={12} className="mr-1.5" /> Deletar
                                </Button>
                              </div>
                           </div>
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

      {/* Dialogs using similar logic to original but calling Proxy */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Textarea placeholder="Motivo..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleBanUser} disabled={isProcessing}>Confirmar Banimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remover Conta Permanentemente</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">Ação irreversível para <strong>{selectedUser?.nickname}</strong>.</div>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing}>Remover Permanentemente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={setCreditsDialogOpen} onOpenChange={setSetCreditsDialogOpen}>
         <DialogContent className="bg-[#0c0b14] border-white/10 rounded-[32px] max-w-sm overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0 relative z-10">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
              Definir <span className="text-primary italic">Créditos</span>
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              {selectedUser?.nickname} • ID: {selectedUser?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 relative z-10">
             <div className="relative group">
               <div className="absolute left-6 top-[38%] -translate-y-1/2 text-primary font-black italic text-sm z-20 group-focus-within:text-white transition-colors pointer-events-none opacity-80 uppercase tracking-tighter">
                 CR
               </div>
               <Input 
                type="number" 
                step="0.01" 
                value={newCreditAmount} 
                onChange={(e) => setNewCreditAmount(e.target.value)} 
                onBlur={() => handleInputBlur(newCreditAmount, setNewCreditAmount)}
                className="bg-white/[0.03] border-white/10 h-16 pl-20 pr-6 rounded-2xl text-2xl font-mono font-black text-white focus-visible:ring-primary/40 focus-visible:bg-white/[0.07] transition-all text-left shadow-inner selection:bg-primary/30"
               />
               <div className="mt-4 text-[9px] font-black uppercase text-center text-gray-400 tracking-[0.2em] bg-white/[0.02] py-2.5 rounded-xl border border-white/5 backdrop-blur-sm">
                 SALDO FINAL: <span className="text-primary">{parseFloat(newCreditAmount || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> <span className="text-[8px] text-primary/40">CR</span>
               </div>
             </div>
          </div>
          <DialogFooter className="p-8 pt-0 relative z-10">
            <Button 
                onClick={handleSetCredits} 
                disabled={isProcessing}
                className="w-full h-14 bg-gradient-primary text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-glow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Confirmar Novo Saldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminKeyDialogOpen} onOpenChange={setAdminKeyDialogOpen}>
        <DialogContent className="bg-[#0c0b14] border-white/10 rounded-[32px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Chave de <span className="text-primary">Acesso Staff</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Input type="text" value={newAdminKey} onChange={(e) => setNewAdminKey(e.target.value)} className="bg-white/5 border-white/10" />
          </div>
          <DialogFooter>
             <Button onClick={handleSetAdminKey} disabled={isProcessing}>Salvar Chave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
