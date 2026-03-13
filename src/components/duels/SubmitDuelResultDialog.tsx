'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MatchDuel, MatchDuelResult } from '@/types';
import { Loader2, Upload, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const resultSchema = z.object({
  rounds_won: z.number().min(0).max(3),
  kills: z.number().min(0),
  screenshot_url: z.string().url('URL da captura de tela inválida'),
});

type ResultFormData = z.infer<typeof resultSchema>;

interface Props {
  duel: MatchDuel;
  children?: React.ReactNode;
}

export function SubmitDuelResultDialog({ duel, children }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      rounds_won: 2,
      kills: 0,
    },
  });

  const submitResult = useMutation({
    mutationFn: async (data: ResultFormData) => {
      if (!user) throw new Error('Não autenticado');

      // 1. Save result entry
      await addDoc(collection(db, 'match_results'), {
        match_id: duel.id,
        team_id: user.uid, // Simplified: user is the team identifier for now
        rounds_won: data.rounds_won,
        kills: data.kills,
        screenshots: [data.screenshot_url],
        submitted_by: user.uid,
        created_at: new Date().toISOString(),
      });

      // 2. Update duel status if necessary 
      // (In a real scenario, we'd wait for both sides or an admin)
      await updateDoc(doc(db, 'matches', duel.id), {
        status: 'playing', // Or 'finished' if we want to auto-complete for demo
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      toast.success('Resultado enviado com sucesso! Aguarde a confirmação do oponente.');
      setOpen(false);
    },
    onError: (err) => {
      console.error('Error submitting result:', err);
      toast.error('Erro ao enviar resultado');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="h-8 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase text-[10px]">
            Relatar Resultado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#0D0D0F] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Reportar Vitória
          </DialogTitle>
          <DialogDescription className="text-gray-500 uppercase text-[9px] font-bold tracking-widest">
            Envie as provas do duelo para liberar o pagamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => submitResult.mutate(data))} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 italic">Rounds Vencidos (MD3)</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={3} 
                  {...register('rounds_won', { valueAsNumber: true })} 
                  className="bg-white/5 border-white/10 h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-500 italic">Total de Kills</Label>
                <Input 
                  type="number" 
                  min={0} 
                  {...register('kills', { valueAsNumber: true })} 
                  className="bg-white/5 border-white/10 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 italic">URL da Screenshot (Prova)</Label>
              <Input 
                {...register('screenshot_url')} 
                placeholder="https://imgur.com/..." 
                className="bg-white/5 border-white/10 h-11 rounded-xl"
              />
              {errors.screenshot_url && <p className="text-[10px] text-destructive font-bold">{errors.screenshot_url.message}</p>}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-widest leading-relaxed">
              ⚠️ ATENÇÃO: Enviar provas falsas resultará em banimento permanente da plataforma Revallo.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:opacity-90 rounded-2xl font-black italic uppercase shadow-lg shadow-primary/20" 
            disabled={submitResult.isPending}
          >
            {submitResult.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Enviar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
