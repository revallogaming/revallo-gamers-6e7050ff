"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail, Trophy, Copy, CheckCircle, ArrowLeft, Clock, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, setDoc, getDocs, query, where, limit } from "firebase/firestore";

import { useTeams, useTeamDetails } from "@/hooks/useTeams";
import { Team, TeamMember, Profile } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface JoinTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: any;
  userId: string;
}

type Step = "registration_type" | "create_team" | "select_team" | "invite_members" | "confirmation" | "pending";

export function JoinTournamentDialog({
  open,
  onOpenChange,
  tournament,
  userId,
}: JoinTournamentDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("confirmation");
  const [teamName, setTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("player");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("cpf");
  
  // New invitation state
  const searchParams = useSearchParams();
  const [assignedRole, setAssignedRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("player");
  const [assignedTeamName, setAssignedTeamName] = useState<string | null>(null);
  
  const { userTeams, createTeam, inviteMemberByEmail } = useTeams(userId);
  const { team: teamDetails, members: teamMembers } = useTeamDetails(selectedTeamId || "");
  const queryClient = useQueryClient();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      const role = searchParams?.get("role") ?? null;
      const team = searchParams?.get("team") ?? null;
      
      if (role || team) {
        setAssignedRole(role as string | null);
        setAssignedTeamName(team as string | null);
        setStep("confirmation");
      } else {
        setStep(tournament?.is_team_based ? "registration_type" : "confirmation");
        setSelectedRole("player");
      }
    } else {
      setAssignedRole(null);
      setAssignedTeamName(null);
      setTeamName("");
      setSelectedTeamId(null);
      setInviteEmail("");
      setInviteRole("player");
    }
  }, [open, tournament?.is_team_based, searchParams]);

  const isPaidTournament = tournament?.entry_fee > 0;
  const entryFeeInBRL = tournament?.entry_fee ? tournament.entry_fee / 100 : 0;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Informe o nome da equipe");
      return;
    }

    setLoading(true);
    try {
      const teamId = await createTeam.mutateAsync({ name: teamName.trim(), captainId: userId });
      setSelectedTeamId(teamId);
      setStep("invite_members");
      toast.success("Equipe criada!");
    } catch (error: any) {
      toast.error("Erro ao criar equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (!selectedTeamId) return;

    if (inviteEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("Você já é o capitão!");
      return;
    }

    try {
      await inviteMemberByEmail.mutateAsync({ 
        teamId: selectedTeamId, 
        email: inviteEmail,
        role: inviteRole,
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        senderNickname: user?.nickname || user?.displayName || "Um jogador"
      });
      setInviteEmail("");
      toast.success("Convite enviado!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const [pixData, setPixData] = useState<any>(null);

  const registerForTournament = async () => {
    if (!user?.email) {
      toast.error("Erro: E-mail não encontrado no seu perfil.");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX para receber prêmios");
      return;
    }

    // 1. Team size validation against tournament format
    if (tournament?.is_team_based && selectedTeamId && tournament.min_team_size > 1) {
      const memberCount = teamMembers.data?.length || 1;
      if (memberCount < tournament.min_team_size) {
        toast.error(`Sua equipe precisa ter pelo menos ${tournament.min_team_size} membros para este torneio (${memberCount}/${tournament.min_team_size})`);
        return;
      }
    }

    setLoading(true);
    try {
      // 2. Idempotency check — prevent double registration
      const participantId = `${tournament.id}_${userId}`;
      
      if (isPaidTournament) {
        // GENERATE PIX QR CODE
        const response = await fetch("/api/create-tournament-registration-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: tournament.id,
            email: user.email,
            amount_brl: entryFeeInBRL,
            team_id: selectedTeamId || null,
            team_name: assignedTeamName || teamName || null,
            role: assignedRole || (selectedTeamId || teamName ? 'captain' : selectedRole),
            pix_key: pixKey,
            pix_key_type: pixKeyType
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao gerar PIX para inscrição");
        }

        const data = await response.json();
        setPixData(data);
        setStep("pending");
        return;
      }

      // FREE TOURNAMENT REGISTRATION
      await setDoc(doc(db, "tournament_participants", participantId), {
        tournament_id: tournament.id,
        player_id: userId,
        team_id: selectedTeamId || null,
        team_name: assignedTeamName || teamName || null,
        role: assignedRole || (selectedTeamId || teamName ? 'captain' : selectedRole),
        participant_email: user.email,
        registered_at: serverTimestamp(),
        placement: null,
        score: 0,
        pix_key: pixKey || null,
        pix_key_type: pixKeyType || null,
      });

      // Increment participant count on tournament
      const tournamentRef = doc(db, "tournaments", tournament.id);
      await updateDoc(tournamentRef, {
        current_participants: increment(1),
      });

      toast.success("Inscrição realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament", tournament.id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["participants", tournament.id] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar inscrição");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success("Código PIX copiado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0B1A]/95 border-white/10 text-white rounded-[2rem] backdrop-blur-2xl">
        <DialogHeader className="pb-4 border-b border-white/5">
          <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Compita na Revallo
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
            {isPaidTournament
              ? `Taxa de Inscrição: R$ ${entryFeeInBRL.toFixed(2).replace(".", ",")}`
              : "Inscrição Gratuita — Entre no jogo"}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-6">
          {step === "registration_type" && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 text-center mb-6 italic">
                Como você deseja participar deste torneio?
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => setStep("select_team")}
                  className="h-20 bg-white/2 border border-white/5 hover:border-primary/50 hover:bg-primary/5 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 group transition-all"
                >
                  <Users className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Minhas Equipes</span>
                </Button>
                <Button 
                  onClick={() => setStep("create_team")}
                  className="h-20 bg-white/2 border border-white/5 hover:border-primary/50 hover:bg-primary/5 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 group transition-all"
                >
                  <UserPlus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Criar Nova Equipe</span>
                </Button>
              </div>
            </div>
          )}

          {step === "select_team" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep("registration_type")} className="h-8 w-8 p-0 hover:bg-white/5 rounded-lg">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Selecione sua Equipe</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {userTeams.isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : userTeams.data?.length === 0 ? (
                  <div className="text-center p-8 bg-white/2 rounded-2xl border border-dashed border-white/5">
                    <p className="text-[10px] font-black uppercase text-gray-600 italic">Você não possui equipes.</p>
                    <Button variant="link" onClick={() => setStep("create_team")} className="text-primary text-[10px] font-black uppercase italic mt-2">Criar equipe agora</Button>
                  </div>
                ) : (
                  userTeams.data?.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setStep("invite_members");
                      }}
                      className="w-full p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                        <Users className="w-6 h-6 text-gray-500 group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black italic uppercase tracking-tighter truncate text-white">{team.name}</p>
                        <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest">{team.members_count} Membros</p>
                      </div>
                      <CheckCircle className={`h-5 w-5 ${selectedTeamId === team.id ? "text-primary opacity-100" : "opacity-0"} transition-opacity`} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === "invite_members" && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep("select_team")} className="h-8 w-8 p-0 hover:bg-white/5 rounded-lg">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Membros da Equipe</span>
                </div>
                <Badge className="text-[9px] font-black uppercase italic tracking-widest bg-primary/20 text-primary border-0 rounded-full px-3">
                  {teamMembers.data?.length || 1}/{tournament.max_team_size || '∞'}
                </Badge>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="E-mail do jogador"
                    className="h-12 bg-white/2 border-white/5 text-xs flex-1 rounded-xl"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-12 bg-black/60 border border-white/5 rounded-xl text-[10px] font-black uppercase px-3 outline-none focus:ring-1 focus:ring-primary text-white"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="analista">Analista</option>
                  </select>
                </div>
                <Button 
                  type="submit" 
                  disabled={inviteMemberByEmail.isPending}
                  className="w-full bg-primary hover:opacity-90 font-black uppercase italic tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-primary/10"
                >
                  {inviteMemberByEmail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Convite Notificação + E-mail"}
                </Button>
              </form>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {teamMembers.data?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 rounded-lg">
                        <AvatarImage src={member.user?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-[10px] font-black italic text-primary">
                          {member.user?.nickname?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-black uppercase italic tracking-tighter truncate max-w-[120px] text-white">
                        {member.user?.nickname || "Convidado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest italic px-2 py-0.5 rounded border ${
                        member.role === 'captain' ? 'border-primary/30 text-primary bg-primary/5' : 
                        member.role === 'coach' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                        member.role === 'analista' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                        'border-white/10 text-gray-500'
                      }`}>
                        {member.role === 'captain' ? 'CAPITÃO' : member.role?.toUpperCase() || 'PLAYER'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {tournament?.min_team_size > 1 && (teamMembers.data?.length || 1) < tournament.min_team_size && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest italic flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    Equipe incompleta: {teamMembers.data?.length || 1}/{tournament.min_team_size} MEMBROS
                  </p>
                </div>
              )}

              <Button 
                onClick={() => setStep("confirmation")}
                className="w-full h-14 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl transition-all shadow-xl"
              >
                PROSSEGUIR PARA INSCRIÇÃO
              </Button>
            </div>
          )}

          {step === "create_team" && (
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("registration_type")} className="h-8 w-8 p-0 hover:bg-white/5 rounded-lg">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Nova Competição, Nova Equipe</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">Nome da Equipe</Label>
                <Input 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Black Dragons"
                  className="h-14 bg-white/2 border-white/5 focus:border-primary/50 rounded-[1.2rem] text-sm"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl transition-all shadow-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar e Prosseguir"}
              </Button>
            </form>
          )}

          {step === "confirmation" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                <CheckCircle className="h-12 w-12 text-primary mx-auto drop-shadow-[0_0_10px_rgba(108,92,231,0.5)]" />
                <div className="space-y-1">
                   <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Quase lá!</h3>
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic leading-relaxed">
                    Você será registrado com: <span className="text-primary">{user?.email}</span>
                   </p>
                </div>
              </div>

              {tournament.is_team_based && teamDetails.data && (
                <div className="p-5 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div>
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1 italic">SUA EQUIPE SELECIONADA</p>
                    <p className="text-base font-black italic uppercase tracking-tighter text-white">{teamDetails.data.name}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep("invite_members")} className="text-[9px] font-black text-primary hover:text-white underline italic">GERENCIAR TIME</Button>
                </div>
              )}

              {!tournament.is_team_based && (
                <div className="space-y-3 p-5 rounded-2xl bg-white/2 border border-white/5">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic mb-1">Qual seu papel neste torneio?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['player', 'coach', 'analista'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`h-11 rounded-xl text-[10px] font-black uppercase italic border transition-all ${
                          selectedRole === role 
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                            : "bg-black/40 border-white/5 text-gray-600 hover:border-white/10"
                        }`}
                      >
                        {role === 'player' ? '🎮 Player' : role === 'coach' ? '🏫 Coach' : '📋 Analista'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 p-5 rounded-2xl bg-white/2 border border-white/5">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic mb-2">Dados para Recebimento de Prêmios (PIX)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">TIPO DE CHAVE</Label>
                    <select 
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full h-11 bg-black/60 border border-white/5 rounded-xl text-[10px] font-black uppercase px-3 focus:ring-1 focus:ring-primary outline-none text-white"
                    >
                      <option value="cpf">CPF</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Aleatória</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">CHAVE PIX</Label>
                    <Input 
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Sua chave"
                      className="h-11 bg-black/60 border-white/5 text-xs rounded-xl focus:border-primary/50"
                      required
                    />
                  </div>
                </div>
                <p className="text-[8px] text-gray-600 italic font-medium leading-normal">* Necessário para automação de pagamentos. Verifique antes de confirmar.</p>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-14 rounded-2xl hover:bg-white/5 font-black uppercase italic text-[11px] text-gray-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={registerForTournament}
                  disabled={loading}
                  className="flex-[2] h-14 bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl shadow-primary/20 transition-all border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isPaidTournament ? "IR PARA PAGAMENTO" : "FINALIZAR INSCRIÇÃO")}
                </Button>
              </div>
            </div>
          )}

          {step === "pending" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
               <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Clock className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Pagamento Pendente</h3>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic leading-relaxed">
                    Efetue o pagamento do PIX abaixo para<br/>confirmar sua vaga no torneio.
                  </p>
               </div>

               <div className="p-8 bg-white rounded-[2rem] flex flex-col items-center gap-6 shadow-2xl">
                  {pixData?.qr_code_base64 ? (
                    <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-xl animate-pulse">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  )}
                  
                  <div className="w-full space-y-3">
                    <p className="text-[10px] font-black uppercase text-gray-400 text-center italic tracking-widest">Copia e Cola</p>
                    <div className="relative group">
                       <Input 
                        value={pixData?.qr_code || ""} 
                        readOnly 
                        className="h-12 bg-gray-50 border-gray-100 text-[10px] font-mono pr-12 text-black rounded-xl"
                       />
                       <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={copyPixCode}
                        className="absolute right-1 top-1 h-10 w-10 text-primary hover:bg-primary/10"
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
               </div>

               <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest italic text-center leading-relaxed">
                    Após o pagamento, sua inscrição será<br/>processada automaticamente.
                  </p>
               </div>

               <Button 
                onClick={() => onOpenChange(false)}
                className="w-full h-14 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl"
               >
                 FECHAR E AGUARDAR
               </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}