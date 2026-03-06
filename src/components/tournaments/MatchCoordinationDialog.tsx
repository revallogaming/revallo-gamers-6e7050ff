"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Gamepad2, 
  Lock, 
  Copy, 
  Flag, 
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { Match, Profile, Team } from "@/types";
import { useMatchActions } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";

interface MatchCoordinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match;
  isOrganizer: boolean;
}

export function MatchCoordinationDialog({
  open,
  onOpenChange,
  match,
  isOrganizer
}: MatchCoordinationDialogProps) {
  const { user } = useAuth();
  const { updateMatchRoom, submitDispute } = useMatchActions(match.tournament_id);
  
  const [roomId, setRoomId] = useState(match.room_id || "");
  const [roomPassword, setRoomPassword] = useState(match.room_password || "");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const isParticipant = user?.uid === match.player1_id || user?.uid === match.player2_id;
  // TODO: Check if user is in team1 or team2 if team-based

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast.error("Informe o ID da sala");
      return;
    }
    await updateMatchRoom.mutateAsync({
      matchId: match.id,
      roomId: roomId.trim(),
      roomPassword: roomPassword.trim()
    });
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      toast.error("Informe o motivo da disputa");
      return;
    }
    await submitDispute.mutateAsync({
      matchId: match.id,
      playerId: user?.uid || "",
      reason: disputeReason.trim()
    });
    setShowDisputeForm(false);
    setDisputeReason("");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0D0B1A] border-white/10 text-white rounded-none">
        <DialogHeader className="border-b border-white/5 pb-4">
          <DialogTitle className="font-black italic uppercase tracking-tighter text-xl flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Coordenação da Partida
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
            Match #{match.position + 1} • {match.status === 'completed' ? 'Finalizada' : 'Em breve'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Organizer: Set Room Info */}
          {isOrganizer && !match.winner_id && (
            <form onSubmit={handleUpdateRoom} className="space-y-4 p-4 bg-white/2 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Configurar Sala</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-gray-500 italic">Room ID</Label>
                  <Input 
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="123456"
                    className="h-10 bg-white/5 border-white/5 text-xs font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-gray-500 italic">Senha</Label>
                  <Input 
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Abc@123"
                    className="h-10 bg-white/5 border-white/5 text-xs font-bold"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={updateMatchRoom.isPending}
                className="w-full h-10 bg-primary text-white font-black uppercase italic tracking-widest text-[9px] rounded-xl"
              >
                {updateMatchRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Dados da Sala"}
              </Button>
            </form>
          )}

          {/* Participant: View Room Info */}
          {(isParticipant || isOrganizer) && match.room_id && (
            <div className="space-y-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Dados da Sala</h3>
                <Badge className="bg-primary/20 text-primary border-primary/20 text-[8px] h-4">DISPONÍVEL</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 relative group">
                  <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Room ID</p>
                  <p className="text-sm font-black italic tracking-tighter truncate">{match.room_id}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(match.room_id!, 'ID da Sala')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 relative group">
                  <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Senha</p>
                  <p className="text-sm font-black italic tracking-tighter truncate">{match.room_password || 'Sem senha'}</p>
                  {match.room_password && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(match.room_password!, 'Senha')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <p className="text-[8px] font-bold text-amber-500 uppercase leading-tight italic">
                  Não compartilhe estes dados. O compartilhamento pode levar à desclassificação.
                </p>
              </div>
            </div>
          )}

          {/* Participant: Dispute Result */}
          {isParticipant && match.status === 'completed' && !showDisputeForm && (
            <Button 
              variant="outline"
              onClick={() => setShowDisputeForm(true)}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 font-black uppercase italic tracking-widest text-[9px] h-10 rounded-xl"
            >
              <Flag className="h-3 w-3 mr-2" /> Questionar Resultado
            </Button>
          )}

          {showDisputeForm && (
            <form onSubmit={handleSubmitDispute} className="space-y-4 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-destructive italic">Abrir Disputa</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDisputeForm(false)} className="h-6 text-[8px] font-black">CANCELAR</Button>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-gray-500 italic">Descreva o ocorrido</Label>
                <Textarea 
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explique por que você está contestando o resultado..."
                  className="bg-white/5 border-white/5 text-xs font-bold min-h-[80px]"
                />
              </div>
              <p className="text-[8px] text-gray-600 font-bold uppercase italic leading-tight">
                Anexe provas via chat se necessário. Nossa equipe analisará o caso.
              </p>
              <Button 
                type="submit" 
                disabled={submitDispute.isPending}
                className="w-full h-10 bg-destructive text-white font-black uppercase italic tracking-widest text-[9px] rounded-xl"
              >
                {submitDispute.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Contestação"}
              </Button>
            </form>
          )}

          {!match.room_id && !isOrganizer && (
            <div className="p-8 text-center bg-white/2 rounded-2xl border border-dashed border-white/5">
              <Shield className="h-8 w-8 text-gray-700 mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase text-gray-600 italic">
                Aguardando o organizador<br/>liberar os dados da sala.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
