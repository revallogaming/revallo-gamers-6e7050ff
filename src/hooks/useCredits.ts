import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { CreditTransaction, PixPayment } from '@/types';

interface CreatePaymentResponse {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  mercadopago_id: string;
}

export function useCredits() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPixPayment = useMutation({
    mutationFn: async ({ amountBrl, creditsAmount }: { amountBrl: number; creditsAmount: number }) => {
      const { data, error } = await supabase.functions.invoke<CreatePaymentResponse>('create-pix-payment', {
        body: { amount_brl: amountBrl, credits_amount: creditsAmount },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar pagamento', description: error.message, variant: 'destructive' });
    },
  });

  const transactions = useQuery({
    queryKey: ['transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!profile?.id,
  });

  const payments = useQuery({
    queryKey: ['payments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('pix_payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PixPayment[];
    },
    enabled: !!profile?.id,
  });

  const spendCredits = useMutation({
    mutationFn: async ({ amount, type, description, referenceId }: { 
      amount: number; 
      type: string; 
      description: string;
      referenceId?: string;
    }) => {
      if (!profile) throw new Error('Usuário não encontrado');

      // Use atomic RPC to prevent race conditions
      const { data, error } = await supabase.rpc('spend_credits', {
        p_user_id: profile.id,
        p_amount: amount,
        p_type: type,
        p_description: description,
        p_reference_id: referenceId || null
      });
      
      if (error) throw error;
      if (!data) throw new Error('Créditos insuficientes');
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Créditos utilizados!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  return {
    credits: profile?.credits ?? 0,
    createPixPayment,
    spendCredits,
    transactions: transactions.data,
    payments: payments.data,
    refreshProfile,
  };
}

export const CREDIT_PACKAGES = [
  { brl: 10, credits: 100, bonus: 0 },
  { brl: 25, credits: 275, bonus: 25 },
  { brl: 50, credits: 600, bonus: 100 },
  { brl: 100, credits: 1300, bonus: 300 },
];
