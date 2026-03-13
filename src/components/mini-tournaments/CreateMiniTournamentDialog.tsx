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
import { useAuth } from '@/hooks/useAuth';
import { useCredits, MINI_TOURNAMENT_CREATION_FEE } from '@/hooks/useCredits';
import { GameType, MiniTournamentFormat, FORMAT_INFO, GAME_INFO, PrizeDistributionConfig } from '@/types';
import { Plus, Loader2, AlertCircle, Coins, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { OrganizerGuide } from '@/components/organizer/OrganizerGuide';
import { cn } from '@/lib/utils';

const createSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().optional(),
  game: z.enum(['freefire', 'valorant', 'cod-warzone', 'blood_strike']),
  format: z.enum(['x1', 'duo', 'trio', 'squad', '4v4']),
  max_participants: z.number().min(2).max(100),
  entry_fee_brl: z.number().min(0, 'Taxa de inscrição não pode ser negativa'),
  prize_pool_brl: z.number().min(1, 'Premiação mínima de R$ 1,00'),
  map: z.string().optional(),
  match_series: z.enum(['MD1', 'MD3', 'MD5']).optional(),
  rules: z.string().optional(),
  start_date: z.string().min(1, 'Data de início obrigatória'),
  registration_deadline: z.string().min(1, 'Prazo de inscrição obrigatório'),
  banner_url: z.string().optional(),
  fee_type: z.enum(['per_player', 'per_team']).default('per_player'),
});

type CreateFormData = z.infer<typeof createSchema>;

interface Props {
  children?: React.ReactNode;
}

export function CreateMiniTournamentDialog({ children }: Props) {
  const { profile } = useAuth();
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
      entry_fee_brl: 0,
      prize_pool_brl: 10,
      banner_url: '',
      fee_type: 'per_player',
    } as any,
  });

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

  const isVerified = profile?.verification_type === 'admin' || profile?.verification_type === 'influencer';

  const generateAutoTitle = (game: GameType, format: MiniTournamentFormat) => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    return `#REV-${randomId}`;
  };

  const onSubmit = async (data: CreateFormData) => {
    if (!hasPixKey) {
      toast.error('Você precisa cadastrar uma chave PIX antes de criar campeonatos');
      return;
    }

    if (totalPercentage !== 100) {
      toast.error('A distribuição de prêmios deve somar 100%');
      return;
    }

    try {
      const finalTitle = isVerified && data.title 
        ? data.title 
        : generateAutoTitle(data.game, data.format);

      // Then create tournament
      await createTournament.mutateAsync({
        title: finalTitle,
        description: data.description,
        game: data.game,
        format: data.format,
        max_participants: data.max_participants,
        entry_fee_brl: data.entry_fee_brl,
        fee_type: data.fee_type,
        prize_pool_brl: data.prize_pool_brl,
        rules: data.rules,
        start_date: data.start_date,
        registration_deadline: data.registration_deadline,
        prize_distribution: prizeDistribution,
        banner_url: (data as any).banner_url,
        map: data.map,
        match_series: data.match_series,
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
            Criar Apostados FF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
            CRIAR <span className="text-primary">APOSTADO</span>
          </DialogTitle>
        </DialogHeader>

        {/* Inscription is now free for organizers */}
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Criação Gratuita!</strong> Você não precisa de créditos para criar este campeonato.
          </span>
        </div>

        <OrganizerGuide type="apostados-flow" className="my-2" />

        {!hasPixKey && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Você precisa cadastrar uma chave PIX no seu perfil antes de criar campeonatos.</span>
          </div>
        )}


        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVerified && (
              <div className="space-y-2">
                <Label>Título do Campeonato *</Label>
                <Input {...register('title')} placeholder="Ex: X1 dos Crias - Buxexa" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Jogo *</Label>
              <div className="h-10 bg-muted/30 border border-border/50 rounded-md flex items-center px-3 opacity-70">
                <span className="text-sm font-medium">Free Fire</span>
              </div>
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
              <Label>Taxa de Inscrição (R$) *</Label>
              <CurrencyInput
                value={watch('entry_fee_brl')}
                onChange={(value) => setValue('entry_fee_brl', value)}
                placeholder="R$ 0,00"
              />
              {errors.entry_fee_brl && <p className="text-sm text-destructive">{errors.entry_fee_brl.message}</p>}
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
          </div>

          {/* Fee Type Selector */}
          {watch('format') !== 'x1' && (
            <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/30">
              <Label className="text-sm font-bold uppercase tracking-tighter italic">Tipo de Cobrança da Inscrição *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('fee_type', 'per_player')}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                    watch('fee_type') === 'per_player' 
                      ? "border-primary bg-primary/10" 
                      : "border-border/30 bg-muted/20"
                  )}
                >
                  <span className="text-[10px] font-black italic uppercase">Por Jogador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('fee_type', 'per_team')}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                    watch('fee_type') === 'per_team' 
                      ? "border-primary bg-primary/10" 
                      : "border-border/30 bg-muted/20"
                  )}
                >
                  <span className="text-[10px] font-black italic uppercase">Por Time / Squad</span>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {watch('fee_type') === 'per_player' 
                  ? "Cada jogador paga individualmente o valor da inscrição ao entrar." 
                  : "O capitão paga o valor total pelo time ao inscrever a equipe."}
              </p>
            </div>
          )}

            <div className="space-y-2">
              <Label>Mapa (Opcional)</Label>
              <Input {...register('map')} placeholder="Ex: Bermuda, Miramar..." />
            </div>

            <div className="space-y-2">
              <Label>Série (Opcional)</Label>
              <Select onValueChange={(v) => setValue('match_series', v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Melhor de..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MD1">Melhor de 1 (MD1)</SelectItem>
                  <SelectItem value="MD3">Melhor de 3 (MD3)</SelectItem>
                  <SelectItem value="MD5">Melhor de 5 (MD5)</SelectItem>
                </SelectContent>
              </Select>
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


          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea {...register('description')} placeholder="Descreva seu campeonato..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Regras</Label>
            <Textarea {...register('rules')} placeholder="Regras do campeonato..." rows={3} />
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

          <div className="sticky bottom-0 bg-background/80 backdrop-blur-md pt-4 pb-2 border-t border-white/5 z-20">
            <Button 
              type="submit" 
              className="w-full h-14 bg-primary text-white hover:opacity-90 rounded-2xl font-black italic uppercase tracking-widest text-sm shadow-xl shadow-primary/20" 
              disabled={createTournament.isPending || !hasPixKey}
            >
              {createTournament.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "PUBLICAR APOSTADO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
