import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPixKey, PixKeyType } from '@/types';
import { toast } from 'sonner';

export function useUserPixKey() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pixKey, isLoading, error } = useQuery({
    queryKey: ['user-pix-key', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_pix_keys')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserPixKey | null;
    },
    enabled: !!user,
  });

  const savePixKey = useMutation({
    mutationFn: async ({ pixKeyType, pixKey: keyValue }: { pixKeyType: PixKeyType; pixKey: string }) => {
      if (!user) throw new Error('Não autenticado');

      const existingKey = await supabase
        .from('user_pix_keys')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingKey.data) {
        const { error } = await supabase
          .from('user_pix_keys')
          .update({ 
            pix_key_type: pixKeyType, 
            pix_key: keyValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_pix_keys')
          .insert({ 
            user_id: user.id,
            pix_key_type: pixKeyType, 
            pix_key: keyValue 
          });

        if (error) throw error;
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
