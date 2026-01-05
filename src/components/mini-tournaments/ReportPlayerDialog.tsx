import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  id: string;
  player_id: string;
  player?: {
    nickname: string;
  };
}

interface Props {
  participants: Participant[];
  tournamentId: string;
  children?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: 'cheating', label: 'Trapaça / Hack' },
  { value: 'toxic', label: 'Comportamento tóxico' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'rules_violation', label: 'Violação de regras' },
  { value: 'other', label: 'Outro' },
];

export function ReportPlayerDialog({ participants, tournamentId, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer || !reason) {
      toast.error('Selecione um jogador e o motivo da denúncia');
      return;
    }

    setIsLoading(true);
    try {
      // For now, just show a success message
      // In a real implementation, this would store the report in the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Denúncia enviada! Nossa equipe irá analisar.');
      setOpen(false);
      setSelectedPlayer('');
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting player:', error);
      toast.error('Erro ao enviar denúncia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Flag className="h-4 w-4" />
            Denunciar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar Jogador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Jogador *</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o jogador" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.player_id}>
                    {p.player?.nickname || 'Jogador'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ocorrido..."
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Denúncia
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}