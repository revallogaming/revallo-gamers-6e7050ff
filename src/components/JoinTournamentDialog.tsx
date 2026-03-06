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
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<string>("cpf");
  
  // New invitation state
  const searchParams = useSearchParams();
  const [assignedRole, setAssignedRole] = useState<string | null>(null);
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
      }
    } else {
      setAssignedRole(null);
      setAssignedTeamName(null);
      setTeamName("");
      setSelectedTeamId(null);
      setInviteEmail("");
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
      await inviteMemberByEmail.mutateAsync({ teamId: selectedTeamId, email: inviteEmail });
      setInviteEmail("");
      toast.success("Membro adicionado!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
      const existingQ = query(
        collection(db, "tournament_participants"),
        where("tournament_id", "==", tournament.id),
        where("player_id", "==", userId),
        limit(1)
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toast.error("Você já está inscrito neste torneio!");
        onOpenChange(false);
        return;
      }

      // 3. Add participant using deterministic ID (prevents race condition duplicates)
      const participantId = `${tournament.id}_${userId}`;
      await setDoc(doc(db, "tournament_participants", participantId), {
        tournament_id: tournament.id,
        player_id: userId,
        team_id: selectedTeamId || null,
        team_name: assignedTeamName || teamName || null,
        role: assignedRole || (selectedTeamId || teamName ? 'captain' : 'player'),
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

      // Email logic (non-blocking)
      try {
        await fetch("/api/send-tournament-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "registration",
            email: user.email,
            tournamentTitle: tournament.title,
            startDate: tournament.start_date,
            entryFee: tournament.entry_fee,
          }),
        });
      } catch (emailError) {}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0B1A] border-white/10 text-white rounded-none">
        <DialogHeader className="pb-4 border-b border-white/5">
          <DialogTitle className="font-black italic uppercase tracking-tighter text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Compita na Revallo
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
            {isPaidTournament
              ? `Inscrição: R$ ${entryFeeInBRL.toFixed(2).replace(".", ",")}`
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
                  className="h-16 bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-0.5 group"
                >
                  <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase italic tracking-widest">Minhas Equipes</span>
                </Button>
                <Button 
                  onClick={() => setStep("create_team")}
                  className="h-16 bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-0.5 group"
                >
                  <UserPlus className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase italic tracking-widest">Criar Nova Equipe</span>
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
                      className="w-full p-4 rounded-xl bg-white/2 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                        <Users className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black italic uppercase tracking-tighter truncate">{team.name}</p>
                        <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest">{team.members_count} Membros</p>
                      </div>
                      <CheckCircle className={`h-4 w-4 ${selectedTeamId === team.id ? "text-primary opacity-100" : "opacity-0"} transition-opacity`} />
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
                <Badge variant="outline" className="text-[8px] font-black uppercase italic tracking-widest border-primary/20 text-primary">
                  {teamMembers.data?.length || 1}/{tournament.max_team_size || '∞'}
                </Badge>
              </div>

              <form onSubmit={handleInvite} className="flex gap-2">
                <Input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="E-mail do jogador"
                  className="h-10 bg-white/2 border-white/5 text-xs"
                />
                <Button 
                  type="submit" 
                  disabled={inviteMemberByEmail.isPending}
                  className="bg-primary hover:opacity-90 font-black uppercase italic tracking-widest text-[8px] px-4 rounded-xl"
                >
                  {inviteMemberByEmail.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Convidar"}
                </Button>
              </form>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {teamMembers.data?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black italic">
                        {member.user?.nickname?.[0] || "?"}
                      </div>
                      <span className="text-[10px] font-black uppercase italic tracking-tighter truncate max-w-[120px]">
                        {member.user?.nickname || "Convidado"}
                      </span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest italic">{member.role === 'captain' ? 'CAPITÃO' : 'PLAYER'}</span>
                  </div>
                ))}
              </div>

              {tournament?.min_team_size > 1 && (teamMembers.data?.length || 1) < tournament.min_team_size && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest italic">
                    ⚠️ Equipe incompleta: {teamMembers.data?.length || 1}/{tournament.min_team_size} membros
                  </p>
                </div>
              )}

              <Button 
                onClick={() => setStep("confirmation")}
                className="w-full h-12 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic tracking-widest text-[10px] rounded-xl transition-all"
              >
                Prosseguir para Inscrição
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
                  className="h-12 bg-white/2 border-white/5 focus:border-primary/50 rounded-xl"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-white text-black hover:bg-primary hover:text-white font-black uppercase italic tracking-widest text-[10px] rounded-xl transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar e Prosseguir"}
              </Button>
            </form>
          )}

          {step === "confirmation" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 text-center space-y-3">
                <CheckCircle className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Quase lá!</h3>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic leading-relaxed">
                  Ao confirmar, você será registrado como participante oficial.<br/>
                  Sua conta: <span className="text-white">{user?.email}</span>
                </p>
              </div>

              {tournament.is_team_based && teamDetails.data && (
                <div className="p-4 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Equipe</p>
                    <p className="text-sm font-black italic uppercase tracking-tighter">{teamDetails.data.name}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep("invite_members")} className="text-[9px] font-black text-primary hover:text-white underline">Mudar Membros</Button>
                </div>
              )}

              <div className="space-y-4 p-4 rounded-xl bg-white/2 border border-white/5">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic mb-2">Dados para Recebimento de Prêmios (PIX)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-gray-600 italic">Tipo de Chave</Label>
                    <select 
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-lg text-xs px-2 focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="cpf">CPF</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-gray-600 italic">Chave PIX</Label>
                    <Input 
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Sua chave aqui"
                      className="h-10 bg-black/40 border-white/10 text-xs"
                      required
                    />
                  </div>
                </div>
                <p className="text-[8px] text-gray-500 italic">* Necessário para automação de premiações via Mercado Pago.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl hover:bg-white/5 font-black uppercase italic text-[10px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={registerForTournament}
                  disabled={loading}
                  className="flex-[2] bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest text-[10px] rounded-xl h-12 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar Inscrição"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}