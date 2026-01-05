import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MiniTournament } from '@/types';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  tournament: MiniTournament;
  children?: React.ReactNode;
}

export function DeleteMiniTournamentDialog({ tournament, children }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Can only delete draft or pending_deposit tournaments
  const canDelete = tournament.status === 'draft' || tournament.status === 'pending_deposit';

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Não é possível excluir este torneio');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('mini_tournaments')
        .delete()
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success('Torneio excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['mini-tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['my-mini-tournaments'] });
      navigate('/comunidade');
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Erro ao excluir torneio');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canDelete) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Mini Torneio</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o torneio "{tournament.title}"? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}