import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useMiniTournaments } from '@/hooks/useMiniTournaments';
import { useUserPixKey } from '@/hooks/useUserPixKey';
import { useCredits, MINI_TOURNAMENT_CREATION_FEE } from '@/hooks/useCredits';
import { GameType, MiniTournamentFormat, FORMAT_INFO, GAME_INFO, PrizeDistributionConfig } from '@/types';
import { Plus, Loader2, AlertCircle, Coins } from 'lucide-react';
import { toast } from 'sonner';

const createSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100),
  description: z.string().optional(),
  game: z.enum(['freefire', 'valorant', 'blood_strike']),
  format: z.enum(['x1', 'duo', 'trio', 'squad']),
  max_participants: z.number().min(2).max(100),
  prize_pool_brl: z.number().min(1, 'Premiação mínima de R$ 1,00'),
  rules: z.string().optional(),
  start_date: z.string().min(1, 'Data de início obrigatória'),
  registration_deadline: z.string().min(1, 'Prazo de inscrição obrigatório'),
});

type CreateFormData = z.infer<typeof createSchema>;

interface Props {
  children?: React.ReactNode;
}

export function CreateMiniTournamentDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [prizeDistribution, setPrizeDistribution] = useState<PrizeDistributionConfig[]>([
    { place: 1, percentage: 100 }
  ]);
  const { createTournament } = useMiniTournaments();
  const { hasPixKey } = useUserPixKey();
  const { credits, spendCredits } = useCredits();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      game: 'freefire',
      format: 'x1',
      max_participants: 2,
      prize_pool_brl: 10,
    },
  });

  const hasEnoughCredits = credits >= MINI_TOURNAMENT_CREATION_FEE;

  const format = watch('format');

  const handleDistributionChange = (index: number, field: 'place' | 'percentage', value: number) => {
    const newDist = [...prizeDistribution];
    newDist[index] = { ...newDist[index], [field]: value };
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

  const onSubmit = async (data: CreateFormData) => {
    if (!hasPixKey) {
      toast.error('Você precisa cadastrar uma chave PIX antes de criar torneios');
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(`Você precisa de ${MINI_TOURNAMENT_CREATION_FEE} créditos para criar um torneio`);
      return;
    }

    if (totalPercentage !== 100) {
      toast.error('A distribuição de prêmios deve somar 100%');
      return;
    }

    try {
      // First spend credits
      await spendCredits.mutateAsync({
        amount: MINI_TOURNAMENT_CREATION_FEE,
        type: 'mini_tournament_creation',
        description: `Criação do mini torneio: ${data.title}`,
      });

      // Then create tournament
      await createTournament.mutateAsync({
        title: data.title,
        description: data.description,
        game: data.game,
        format: data.format,
        max_participants: data.max_participants,
        entry_fee_credits: 0, // Always free for players
        prize_pool_brl: data.prize_pool_brl,
        rules: data.rules,
        start_date: data.start_date,
        registration_deadline: data.registration_deadline,
        prize_distribution: prizeDistribution,
      });
      setOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Mini Torneio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Mini Torneio</DialogTitle>
        </DialogHeader>

        {/* Creation fee info */}
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          <Coins className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Taxa de criação: <strong>{MINI_TOURNAMENT_CREATION_FEE} créditos</strong>
            {' '}(você tem {credits} créditos)
          </span>
        </div>

        {!hasPixKey && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Você precisa cadastrar uma chave PIX no seu perfil antes de criar torneios.</span>
          </div>
        )}

        {!hasEnoughCredits && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Você precisa de {MINI_TOURNAMENT_CREATION_FEE} créditos para criar um torneio.</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título do Torneio *</Label>
              <Input {...register('title')} placeholder="Ex: X1 Valendo Tudo" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Jogo *</Label>
              <Select defaultValue="freefire" onValueChange={(v) => setValue('game', v as GameType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GAME_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato *</Label>
              <Select defaultValue="x1" onValueChange={(v) => setValue('format', v as MiniTournamentFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nº de Participantes *</Label>
              <Input
                type="number"
                min={2}
                max={100}
                {...register('max_participants', { valueAsNumber: true })}
              />
              {errors.max_participants && <p className="text-sm text-destructive">{errors.max_participants.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Premiação (R$) *</Label>
              <CurrencyInput
                value={watch('prize_pool_brl')}
                onChange={(value) => setValue('prize_pool_brl', value)}
                placeholder="R$ 0,00"
              />
              {errors.prize_pool_brl && <p className="text-sm text-destructive">{errors.prize_pool_brl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Data/Hora de Início *</Label>
              <Input type="datetime-local" {...register('start_date')} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Prazo de Inscrição *</Label>
              <Input type="datetime-local" {...register('registration_deadline')} />
              {errors.registration_deadline && <p className="text-sm text-destructive">{errors.registration_deadline.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea {...register('description')} placeholder="Descreva seu torneio..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Regras</Label>
            <Textarea {...register('rules')} placeholder="Regras do torneio..." rows={3} />
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
                    onChange={(e) => handleDistributionChange(index, 'percentage', Number(e.target.value))}
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createTournament.isPending || spendCredits.isPending || !hasPixKey || !hasEnoughCredits}
          >
            {(createTournament.isPending || spendCredits.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Torneio ({MINI_TOURNAMENT_CREATION_FEE} créditos)
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
