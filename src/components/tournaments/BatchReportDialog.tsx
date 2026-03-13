"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tournament, 
  TournamentFall, 
  TournamentParticipant, 
  FallResult,
  SCORING_SYSTEMS
} from "@/types";
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Users,
  Save,
  ChevronDown,
  Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReportFallResults } from "@/hooks/usePointsTournament";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { OrganizerGuide } from "@/components/organizer/OrganizerGuide";

interface BatchReportDialogProps {
  tournament: Tournament;
  fall: TournamentFall;
  participants: TournamentParticipant[];
  children: React.ReactNode;
}

interface DraftResult {
  participantId: string;
  placement: string;
  kills: string;
  nickname: string;
  teamName?: string;
  avatarUrl?: string;
  points: number;
}

export function BatchReportDialog({ 
  tournament, 
  fall, 
  participants, 
  children 
}: BatchReportDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const reportResults = useReportFallResults(tournament.id);
  
  const [drafts, setDrafts] = useState<DraftResult[]>([]);

  // Initialize drafts when dialog opens
  useEffect(() => {
    if (open && participants) {
      const initialDrafts = participants.map(p => ({
        participantId: p.id,
        placement: "",
        kills: "0",
        nickname: p.player?.nickname || 'Jogador',
        teamName: p.team_name || undefined,
        avatarUrl: p.player?.avatar_url || undefined,
        points: 0
      }));
      setDrafts(initialDrafts);
    }
  }, [open, participants]);

  const scoringConfig = tournament.scoring_config || SCORING_SYSTEMS.lbff;

  const calculatePoints = (placement: number, kills: number) => {
    const placementPts = scoringConfig.placement_points[placement] || 0;
    const killPts = kills * scoringConfig.points_per_kill;
    let total = placementPts + killPts;
    
    // Add Booyah Bonus
    if (placement === 1 && scoringConfig.booyah_bonus) {
      total += scoringConfig.booyah_bonus;
    }
    
    // Add Top 5 Bonus
    if (placement <= 5 && placement > 0 && scoringConfig.top5_bonus) {
      total += scoringConfig.top5_bonus;
    }
    
    return total;
  };

  const handleInputChange = (index: number, field: 'placement' | 'kills', value: string) => {
    const newDrafts = [...drafts];
    newDrafts[index][field] = value;
    
    const p = parseInt(newDrafts[index].placement) || 0;
    const k = parseInt(newDrafts[index].kills) || 0;
    newDrafts[index].points = calculatePoints(p, k);
    
    setDrafts(newDrafts);
  };

  const validateResults = () => {
    const placements = drafts
      .map(d => parseInt(d.placement))
      .filter(p => !isNaN(p) && p > 0);
    
    // Check for duplicates
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      toast.error("Erro: Existem posições duplicadas no formulário.");
      return false;
    }

    // Check if any placement is missing
    if (placements.length < drafts.length) {
      return confirm("Alguns times estão sem posição. Eles ficarão com 0 pontos. Deseja continuar?");
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateResults()) return;
    if (!user) return;

    try {
      const formattedResults = drafts
        .filter(d => d.placement !== "")
        .map(d => ({
          fall_id: fall.id,
          participant_id: d.participantId,
          placement: parseInt(d.placement),
          kills: parseInt(d.kills) || 0,
          points: d.points
        }));

      await reportResults.mutateAsync({
        fallId: fall.id,
        results: formattedResults
      });

      setOpen(false);
    } catch (err) {
      // toast is handled by hook
    }
  };

  const sortedDrafts = [...drafts].sort((a, b) => {
    const ap = parseInt(a.placement) || 999;
    const bp = parseInt(b.placement) || 999;
    return ap - bp;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] p-0 bg-[#0A0A0C] border-white/5 overflow-hidden flex flex-col rounded-[32px]">
        <DialogHeader className="p-6 md:p-8 bg-[#0D0D0F] border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                 <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white">Relatório da Queda #{fall.fall_number}</DialogTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Preencha os resultados de todos os participantes</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-8 shrink-0 bg-primary/5 border-b border-white/5 space-y-4">
           <OrganizerGuide type="scoring" />
           <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 text-primary text-[10px] uppercase font-black italic tracking-widest">SISTEMA ATIVO: {tournament.scoring_config?.type?.toUpperCase() || 'LBFF'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase italic text-gray-400">
                 <Flame className="h-3 w-3 text-primary" />
                 1 Kill = {scoringConfig.points_per_kill} Ponto
              </div>
              {scoringConfig.booyah_bonus && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase italic text-amber-500">
                   <Star className="h-3 w-3 fill-amber-500" />
                   Booyah = +{scoringConfig.booyah_bonus} Bônus
                </div>
              )}
           </div>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="space-y-4">
            {drafts.map((draft, idx) => (
              <div 
                key={draft.participantId} 
                className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-5 bg-white/2 border border-white/5 rounded-[24px] hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <Avatar className="h-12 w-12 border-2 border-white/5 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                      <AvatarImage src={draft.avatarUrl} />
                      <AvatarFallback className="bg-primary/5 text-primary font-black italic">{draft.nickname[0]}</AvatarFallback>
                   </Avatar>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black italic uppercase tracking-tighter text-white truncate">{draft.nickname}</h4>
                      <p className="text-[9px] font-black uppercase text-gray-600 italic tracking-widest truncate">{draft.teamName || 'Solo Player'}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                   <div className="space-y-1.5 flex-1 md:flex-none md:w-24">
                      <Label className="text-[9px] font-black uppercase text-gray-500 italic ml-1">Posição</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={draft.placement}
                          onChange={(e) => handleInputChange(idx, 'placement', e.target.value)}
                          className="h-10 bg-black border-white/5 rounded-xl font-black italic text-center focus:ring-primary focus:border-primary pr-2"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-700 italic">º</span>
                      </div>
                   </div>

                   <div className="space-y-1.5 flex-1 md:flex-none md:w-24">
                      <Label className="text-[9px] font-black uppercase text-gray-500 italic ml-1">Kills</Label>
                      <Input 
                        type="number"
                        placeholder="0"
                        value={draft.kills}
                        onChange={(e) => handleInputChange(idx, 'kills', e.target.value)}
                        className="h-10 bg-black border-white/5 rounded-xl font-black italic text-center focus:ring-primary focus:border-primary"
                      />
                   </div>

                   <div className="flex flex-col items-center justify-center min-w-[70px] bg-white/2 border border-white/5 h-16 md:h-12 px-4 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-gray-600 italic">TOTAL</p>
                      <p className="text-base font-black italic text-primary">{draft.points} pts</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 md:p-8 bg-[#0D0D0F] border-t border-white/5 flex flex-col md:flex-row gap-4 shrink-0">
           <Button 
             variant="ghost" 
             onClick={() => setOpen(false)}
             className="text-[10px] font-black uppercase italic tracking-widest text-gray-500 hover:text-white h-14 px-8"
           >
             Cancelar
           </Button>
           <Button 
             onClick={handleSubmit}
             disabled={reportResults.isPending}
             className="bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest rounded-2xl h-14 px-10 shadow-xl shadow-primary/20 flex-1 md:flex-none"
           >
             {reportResults.isPending ? "Salvando..." : "Finalizar Relatório"}
             <Save className="h-4 w-4 ml-2" />
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
