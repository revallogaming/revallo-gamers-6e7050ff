'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useDuels } from '@/hooks/useDuels';
import { useUserPixKey } from '@/hooks/useUserPixKey';
import { GameType, GAME_INFO } from '@/types';
import { Sword, Loader2, AlertCircle, Trophy, Image as ImageIcon, Sparkles, Coins, Zap, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

const duelSchema = z.object({
  game: z.enum(['freefire', 'valorant', 'cod-warzone', 'blood_strike']),
  mode: z.enum(['1v1', '2v2', '4v4']),
  entry_fee_brl: z.number().min(1, 'Aposta mínima de R$ 1,00'),
  format: z.enum(['MD1', 'MD3', 'MD5']),
  map: z.string().min(1, 'Mapa é obrigatório'),
  banner_url: z.string().optional(),
});

type DuelFormData = z.infer<typeof duelSchema>;

const RANDOM_BANNERS = [
  '/images/banners/15953551675f17301fc6163_1595355167_3x2_md.jpg',
  '/images/banners/450_1000.webp',
  '/images/banners/FREE-FIRE-NOVO.webp',
  '/images/banners/blood_strike.webp',
  '/images/banners/cod.jpg',
  '/images/banners/gametiles_com.dts.freefireth.jpg',
  '/images/banners/valorant.png',
];

interface Props {
  children?: React.ReactNode;
}

export function CreateDuelDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { createDuel } = useDuels();
  const { hasPixKey } = useUserPixKey();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DuelFormData>({
    resolver: zodResolver(duelSchema),
    defaultValues: {
      game: 'freefire',
      mode: '4v4',
      entry_fee_brl: 10,
      format: 'MD3',
      map: 'Bermuda',
    },
  });

  const entryFee = watch('entry_fee_brl') || 0;
  const mode = watch('mode');
  const game = watch('game');
  const playersCount = mode === '4v4' ? 8 : (mode === '2v2' ? 4 : 2);
  const totalPool = entryFee * playersCount;
  const platformFee = totalPool * 0.15;
  const prizePool = totalPool - platformFee;

  const onSubmit = async (data: DuelFormData) => {
    if (!hasPixKey) {
      toast.error('Você precisa cadastrar uma chave PIX antes de criar duelos apostados');
      return;
    }

    try {
      const randomBanner = RANDOM_BANNERS[Math.floor(Math.random() * RANDOM_BANNERS.length)];
      await createDuel.mutateAsync({
        game: data.game,
        mode: data.mode,
        entry_fee_brl: data.entry_fee_brl,
        format: data.format,
        map: data.map,
        title: `${data.mode} ${GAME_INFO[data.game].name}`,
        banner_url: data.banner_url || randomBanner,
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
          <Button className="gap-2 bg-primary hover:opacity-90 font-black italic uppercase rounded-2xl h-12 px-8 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Criar Duelo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-[#09090B] border-white/5 text-white p-0 overflow-hidden rounded-[32px] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Sword className="h-6 w-6 text-primary animate-pulse" />
               </div>
               <div>
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                    CRIAR <span className="text-primary italic">APOSTADO</span>
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 uppercase text-[9px] font-black tracking-[0.2em] mt-1 italic">
                     Configure seu desafio e aguarde um adversário no lobby
                  </DialogDescription>
                </div>
             </div>
           </DialogHeader>

           {/* Inscription Info - Free Creation */}
           <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
             <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-green-500" />
             </div>
             <p className="text-[10px] font-black uppercase italic text-green-500/80 tracking-widest leading-relaxed">
               Criação <span className="text-white">Gratuita</span>! Você não paga nada para criar o desafio. A aposta é descontada apenas dos participantes.
             </p>
           </div>

           {!hasPixKey && (
             <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-2xl">
               <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
               <p className="text-[10px] font-black uppercase italic text-destructive tracking-widest leading-relaxed">
                 Atenção: Cadastre sua <span className="text-white">Chave PIX</span> nas configurações para receber o prêmio.
               </p>
             </div>
           )}

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-6">
                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1">Modalidade do Game</Label>
                   <Select value={game} onValueChange={(v) => setValue('game', v as DuelFormData['game'])}>
                     <SelectTrigger className="bg-white/[0.03] border-white/5 h-14 rounded-2xl focus:ring-primary/40 focus:border-primary/50 transition-all font-bold">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="bg-[#09090B] border-white/10 rounded-2xl">
                       {Object.entries(GAME_INFO).map(([key, info]) => (
                         <SelectItem key={key} value={key} className="text-white hover:bg-white/5 rounded-xl font-bold italic">{info.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1">Aposta por Jogador</Label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-xs font-black text-primary">R$</span>
                     </div>
                     <CurrencyInput
                       value={entryFee}
                       onChange={(val) => setValue('entry_fee_brl', val)}
                       className="bg-white/[0.03] border-white/5 h-14 rounded-2xl pl-10 focus:ring-primary/40 focus:border-primary/50 transition-all font-black italic text-lg shadow-inner"
                     />
                   </div>
                   {errors.entry_fee_brl && <p className="text-[9px] text-destructive font-bold uppercase italic mt-1">{errors.entry_fee_brl.message}</p>}
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1">Mapa da Partida</Label>
                   <Input 
                     {...register('map')} 
                     placeholder="Ex: Bermuda, Miramar..." 
                     className="bg-white/[0.03] border-white/5 h-14 rounded-2xl focus:ring-primary/40 focus:border-primary/50 transition-all font-bold placeholder:text-gray-800"
                   />
                   {errors.map && <p className="text-[9px] text-destructive font-bold uppercase italic mt-1">{errors.map.message}</p>}
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1">Formato da Partida</Label>
                   <Select value={watch('mode')} onValueChange={(v) => setValue('mode', v as any)}>
                     <SelectTrigger className="bg-white/[0.03] border-white/5 h-14 rounded-2xl focus:ring-primary/40 focus:border-primary/50 transition-all font-bold">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="bg-[#09090B] border-white/10 rounded-2xl">
                       <SelectItem value="1v1" className="text-white rounded-xl font-bold">1v1 QUICK DUEL</SelectItem>
                       <SelectItem value="2v2" className="text-white rounded-xl font-bold">2v2 TEAM DUEL</SelectItem>
                       <SelectItem value="4v4" className="text-white rounded-xl font-bold">4v4 CLAN BATTLE</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1">Série</Label>
                   <Select value={watch('format')} onValueChange={(v) => setValue('format', v as any)}>
                     <SelectTrigger className="bg-white/[0.03] border-white/5 h-14 rounded-2xl focus:ring-primary/40 focus:border-primary/50 transition-all font-bold">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="bg-[#09090B] border-white/10 rounded-2xl">
                       <SelectItem value="MD1" className="text-white rounded-xl font-bold">MELHOR DE 1</SelectItem>
                       <SelectItem value="MD3" className="text-white rounded-xl font-bold">MELHOR DE 3</SelectItem>
                       <SelectItem value="MD5" className="text-white rounded-xl font-bold">MELHOR DE 5</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-gray-500 tracking-widest italic ml-1 flex items-center justify-between">
                     Banner do Desafio (Opcional)
                     <span className="text-[8px] opacity-40">Fallback aleatório</span>
                   </Label>
                   <div className="relative">
                     <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                     <Input 
                       {...register('banner_url')} 
                       placeholder="URL da Imagem (https://...)" 
                       className="bg-white/[0.03] border-white/5 h-14 rounded-2xl pl-12 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium text-xs placeholder:text-gray-800"
                     />
                   </div>
                 </div>
               </div>
             </div>

             {/* Prize Summary - Advanced UI */}
             <div className="p-6 rounded-[24px] bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent border border-primary/20 space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy className="h-20 w-20 text-primary -rotate-12" />
               </div>
               
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                 <span className="text-gray-500 flex items-center gap-2">
                   <Users className="h-3 w-3" />
                   Pool Acumulativo ({playersCount} Players)
                 </span>
                 <span className="text-white">R$ {totalPool.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                 <span className="text-gray-600 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Manutenção da Plataforma (15%)
                 </span>
                 <span className="text-destructive">- R$ {platformFee.toFixed(2)}</span>
               </div>
               
               <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                 <div>
                    <span className="text-[10px] font-black uppercase italic text-primary/60 tracking-widest block mb-1">TOTAL DA PREMIAÇÃO</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter shadow-primary/20 drop-shadow-2xl">
                      R$ {prizePool.toFixed(2)}
                    </span>
                 </div>
                 <div className="bg-primary/20 px-4 py-2 rounded-xl text-primary font-black italic text-[11px] uppercase border border-primary/20 shadow-glow-sm">
                    WINNER TAKES ALL
                 </div>
               </div>
             </div>

             <Button 
               type="submit" 
               className="w-full h-16 bg-white text-black hover:bg-white/90 active:scale-[0.98] rounded-[24px] font-black italic uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50" 
               disabled={createDuel.isPending || !hasPixKey}
             >
               <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
               <span className="hidden group-hover:inline absolute left-8 animate-bounce"><Sword className="h-5 w-5" /></span>
               <span className="relative z-10 flex items-center gap-2 font-black">
                 {createDuel.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "CRIAR APOSTADO"}
               </span>
               <span className="hidden group-hover:inline absolute right-8 animate-bounce"><Trophy className="h-5 w-5" /></span>
             </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
