import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { MiniTournament, PrizeDistributionConfig } from '@/types';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const editSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100),
  description: z.string().optional(),
  prize_pool_brl: z.number().min(1, 'Premiação mínima de R$ 1,00'),
  rules: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface Props {
  tournament: MiniTournament;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditMiniTournamentDialog({ tournament, onSuccess, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prizeDistribution, setPrizeDistribution] = useState<PrizeDistributionConfig[]>(
    tournament.prize_distribution
  );
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: tournament.title,
      description: tournament.description || '',
      prize_pool_brl: tournament.prize_pool_brl,
      rules: tournament.rules || '',
    },
  });

  const handleDistributionChange = (index: number, value: number) => {
    const newDist = [...prizeDistribution];
    newDist[index] = { ...newDist[index], percentage: value };
    setPrizeDistribution(newDist);
  };

  const addDistribution = () => {
    if (prizeDistribution.length < 3) {
      const nextPlace = prizeDistribution.length + 1;
      setPrizeDistribution([...prizeDistribution, { place: nextPlace, percentage: 0 }]);
    }
  };

  const removeDistribution = (index: number) => {
    if (prizeDistribution.length > 1) {
      setPrizeDistribution(prizeDistribution.filter((_, i) => i !== index));
    }
  };

  const totalPercentage = prizeDistribution.reduce((sum, d) => sum + d.percentage, 0);

  // Can only edit prize if deposit not confirmed
  const canEditPrize = !tournament.deposit_confirmed;

  const onSubmit = async (data: EditFormData) => {
    if (totalPercentage !== 100) {
      toast.error('A distribuição de prêmios deve somar 100%');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        title: data.title,
        description: data.description || null,
        rules: data.rules || null,
      };

      // Only update prize if allowed
      if (canEditPrize) {
        updateData.prize_pool_brl = data.prize_pool_brl;
        updateData.prize_distribution = JSON.stringify(prizeDistribution);
      }

      const { error } = await supabase
        .from('mini_tournaments')
        .update(updateData)
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success('Torneio atualizado!');
      queryClient.invalidateQueries({ queryKey: ['mini-tournament', tournament.id] });
      queryClient.invalidateQueries({ queryKey: ['mini-tournaments'] });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Erro ao atualizar torneio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Mini Torneio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Título do Torneio *</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea {...register('description')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Regras</Label>
            <Textarea {...register('rules')} rows={3} />
          </div>

          {canEditPrize ? (
            <>
              <div className="space-y-2">
                <Label>Premiação (R$) *</Label>
                <CurrencyInput
                  value={watch('prize_pool_brl')}
                  onChange={(value) => setValue('prize_pool_brl', value)}
                  placeholder="R$ 0,00"
                />
                {errors.prize_pool_brl && <p className="text-sm text-destructive">{errors.prize_pool_brl.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Distribuição de Prêmios</Label>
                  {prizeDistribution.length < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={addDistribution}>
                      Adicionar Posição
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {prizeDistribution.map((dist, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-16">{dist.place}º Lugar</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={dist.percentage}
                        onChange={(e) => handleDistributionChange(index, Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm">%</span>
                      {prizeDistribution.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDistribution(index)}
                          className="text-destructive"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className={`text-sm ${totalPercentage === 100 ? 'text-green-500' : 'text-destructive'}`}>
                  Total: {totalPercentage}% {totalPercentage !== 100 && '(deve ser 100%)'}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              A premiação não pode ser editada após o depósito ser confirmado.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}