import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MiniTournament, MiniTournamentParticipant } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SubmitResultsDialogProps {
  tournament: MiniTournament;
  participants: MiniTournamentParticipant[];
  children: React.ReactNode;
  onSuccess?: () => void;
}

interface PlacementResult {
  player_id: string;
  placement: number;
}

export function SubmitResultsDialog({ 
  tournament, 
  participants, 
  children,
  onSuccess 
}: SubmitResultsDialogProps) {
  const [open, setOpen] = useState(false);
  const [placements, setPlacements] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get the number of prize places from the distribution
  const prizePositions = tournament.prize_distribution.length;

  const submitResults = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Não autenticado');

      // Build results array
      const results: PlacementResult[] = [];
      for (const [playerId, placement] of Object.entries(placements)) {
        if (placement > 0) {
          results.push({ player_id: playerId, placement });
        }
      }

      // Validate we have all required placements
      const expectedPlacements = tournament.prize_distribution.map(d => d.place);
      const submittedPlacements = results.map(r => r.placement);
      const missingPlacements = expectedPlacements.filter(p => !submittedPlacements.includes(p));

      if (missingPlacements.length > 0) {
        throw new Error(`Defina os vencedores para as posições: ${missingPlacements.join(', ')}`);
      }

      // Check for duplicate placements
      const uniquePlacements = new Set(submittedPlacements);
      if (uniquePlacements.size !== submittedPlacements.length) {
        throw new Error('Cada posição deve ter apenas um vencedor');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/distribute-prizes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            tournament_id: tournament.id,
            results,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao submeter resultados');
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournament-participants', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['my-mini-tournaments'] });
      
      if (data.all_successful) {
        toast.success('Resultados enviados e prêmios distribuídos com sucesso!');
      } else {
        toast.warning('Resultados enviados, mas alguns pagamentos falharam. Verifique o histórico.');
      }
      
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePlacementChange = (playerId: string, placement: string) => {
    setPlacements(prev => ({
      ...prev,
      [playerId]: parseInt(placement) || 0,
    }));
  };

  const getPlacementOptions = () => {
    const usedPlacements = new Set(Object.values(placements).filter(p => p > 0));
    return Array.from({ length: prizePositions }, (_, i) => i + 1);
  };

  const isPlacementUsed = (placement: number, currentPlayerId: string) => {
    for (const [playerId, p] of Object.entries(placements)) {
      if (playerId !== currentPlayerId && p === placement) {
        return true;
      }
    }
    return false;
  };

  const getPrizeForPlacement = (placement: number) => {
    const dist = tournament.prize_distribution.find(d => d.place === placement);
    if (!dist) return null;
    return (tournament.prize_pool_brl * dist.percentage / 100).toFixed(2);
  };

  const canSubmit = () => {
    const expectedPlacements = tournament.prize_distribution.map(d => d.place);
    const submittedPlacements = Object.values(placements).filter(p => p > 0);
    return expectedPlacements.every(p => submittedPlacements.includes(p));
  };

  if (!tournament.deposit_confirmed) {
    return null;
  }

  if (tournament.prizes_distributed_at) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Submeter Resultados
          </DialogTitle>
          <DialogDescription>
            Defina a colocação dos vencedores para distribuir os prêmios via PIX automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prize summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Premiação a distribuir:</p>
            <div className="flex flex-wrap gap-2">
              {tournament.prize_distribution.map((dist) => (
                <Badge key={dist.place} variant="secondary" className="gap-1">
                  {dist.place}º: R$ {getPrizeForPlacement(dist.place)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">Atenção</p>
              <p className="text-muted-foreground">
                Esta ação é irreversível. Os prêmios serão enviados via PIX imediatamente após a confirmação.
              </p>
            </div>
          </div>

          {/* Participants list */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Selecione os vencedores:</p>
            
            {participants.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum participante inscrito
              </p>
            ) : (
              participants.map((participant) => (
                <div 
                  key={participant.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.player?.avatar_url || undefined} />
                    <AvatarFallback>
                      {participant.player?.nickname?.charAt(0).toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {participant.player?.nickname || 'Jogador'}
                    </p>
                  </div>

                  <Select
                    value={placements[participant.player_id]?.toString() || '0'}
                    onValueChange={(value) => handlePlacementChange(participant.player_id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Colocação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Não premiado</SelectItem>
                      {getPlacementOptions().map((place) => (
                        <SelectItem 
                          key={place} 
                          value={place.toString()}
                          disabled={isPlacementUsed(place, participant.player_id)}
                        >
                          {place}º lugar - R$ {getPrizeForPlacement(place)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>

          {/* Selected winners summary */}
          {Object.values(placements).some(p => p > 0) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Vencedores selecionados:
              </p>
              <div className="space-y-1">
                {Object.entries(placements)
                  .filter(([_, p]) => p > 0)
                  .sort(([_, a], [__, b]) => a - b)
                  .map(([playerId, placement]) => {
                    const participant = participants.find(p => p.player_id === playerId);
                    return (
                      <div key={playerId} className="flex items-center justify-between text-sm">
                        <span>{placement}º - {participant?.player?.nickname || 'Jogador'}</span>
                        <span className="font-medium text-primary">
                          R$ {getPrizeForPlacement(placement)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => submitResults.mutate()}
            disabled={!canSubmit() || submitResults.isPending}
          >
            {submitResults.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Distribuir Prêmios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
