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
        .order('created_at', { ascending: false })
        .limit(50); // Limit to recent transactions
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const payments = useQuery({
    queryKey: ['payments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('pix_payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent payments
      
      if (error) throw error;
      return data as PixPayment[];
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 30, // 30 seconds - payments need fresher data
    gcTime: 1000 * 60 * 5, // 5 minutes
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

  // Query credits from user_credits table
  const creditsQuery = useQuery({
    queryKey: ['user_credits', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.balance ?? 0;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    credits: creditsQuery.data ?? profile?.credits ?? 0,
    createPixPayment,
    spendCredits,
    transactions: transactions.data,
    payments: payments.data,
    refreshProfile: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['user_credits'] });
    },
  };
}

export const CREDIT_PACKAGES = [
  { brl: 5, credits: 50, bonus: 0 },
  { brl: 10, credits: 110, bonus: 10 },
  { brl: 25, credits: 300, bonus: 50 },
  { brl: 50, credits: 650, bonus: 150 },
  { brl: 100, credits: 1400, bonus: 400 },
  { brl: 150, credits: 2250, bonus: 750 },
];

export const MINI_TOURNAMENT_CREATION_FEE = 15;
