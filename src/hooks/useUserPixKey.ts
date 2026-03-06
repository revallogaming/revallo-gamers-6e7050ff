import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { UserPixKey, PixKeyType } from '@/types';
import { toast } from 'sonner';

export function useUserPixKey() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pixKey, isLoading, error } = useQuery({
    queryKey: ['user-pix-key', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      
      const q = query(
        collection(db, 'user_pix_keys'),
        where('user_id', '==', user.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserPixKey;
    },
    enabled: !!user,
  });

  const savePixKey = useMutation({
    mutationFn: async ({ pixKeyType, pixKey: keyValue }: { pixKeyType: PixKeyType; pixKey: string }) => {
      if (!user) throw new Error('Não autenticado');

      const q = query(
        collection(db, 'user_pix_keys'),
        where('user_id', '==', user.uid),
        limit(1)
      );
      
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = doc(db, 'user_pix_keys', snapshot.docs[0].id);
        await updateDoc(docRef, {
          pix_key_type: pixKeyType, 
          pix_key: keyValue,
          updated_at: new Date().toISOString()
        });
      } else {
        await setDoc(doc(db, 'user_pix_keys', user.uid), { 
          user_id: user.uid,
          pix_key_type: pixKeyType, 
          pix_key: keyValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pix-key'] });
      toast.success('Chave PIX salva com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving PIX key:', error);
      toast.error('Erro ao salvar chave PIX');
    },
  });

  return {
    pixKey,
    isLoading,
    error,
    savePixKey,
    hasPixKey: !!pixKey,
  };
}
