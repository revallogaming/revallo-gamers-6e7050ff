import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { toast } from "sonner";
import { CreditTransaction, PixPayment } from '@/types';

interface CreatePaymentResponse {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  mercadopago_id: string;
}

export function useCredits() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const createPixPayment = useMutation({
    mutationFn: async ({ amountBrl, creditsAmount }: { amountBrl: number; creditsAmount: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/create-pix-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
            userId: user.uid,
            amount_brl: amountBrl, 
            credits_amount: creditsAmount 
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao criar pagamento');
      return data as CreatePaymentResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar pagamento: ' + error.message);
    },
  });

  const transactions = useQuery({
    queryKey: ['transactions', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      // Use only orderBy to avoid composite index; filter user client-side
      const q = query(
        collection(db, 'credit_transactions'),
        orderBy('created_at', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as CreditTransaction)
        .filter(t => t.user_id === user.uid)
        .slice(0, 50);
    },
    enabled: !!user?.uid,
  });

  const payments = useQuery({
    queryKey: ['payments', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      // Use only orderBy to avoid composite index; filter user client-side
      const q = query(
        collection(db, 'pix_payments'),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as PixPayment)
        .filter(p => p.user_id === user.uid)
        .slice(0, 20);
    },
    enabled: !!user?.uid,
  });

  const spendCredits = useMutation({
    mutationFn: async ({ amount, type, description, referenceId }: { 
      amount: number; 
      type: string; 
      description: string;
      referenceId?: string;
    }) => {
      if (!user) throw new Error('Usuário não encontrado');

      const idToken = await user.getIdToken();
      const response = await fetch('/api/spend-credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            userId: user.uid,
            amount,
            type,
            description,
            referenceId
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao utilizar créditos');
      return data;
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Créditos utilizados!');
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  return {
    credits: profile?.credits ?? 0,
    createPixPayment,
    spendCredits,
    transactions: transactions.data || [],
    payments: payments.data || [],
    refreshProfile: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['payments', user?.uid] });
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
