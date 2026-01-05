import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, Gamepad2, Edit, Trash2, Users, Coins } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { GAME_INFO, GameType } from "@/types";
import { Database } from "@/integrations/supabase/types";

type MiniTournamentStatus = Database["public"]["Enums"]["mini_tournament_status"];

interface MiniTournament {
  id: string;
  title: string;
  game: GameType;
  status: MiniTournamentStatus;
  organizer_id: string;
  current_participants: number;
  max_participants: number;
  prize_pool_brl: number;
  entry_fee_credits: number;
  start_date: string;
  organizer_nickname?: string;
}

const MINI_STATUS_INFO: Record<MiniTournamentStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: '#6b7280' },
  pending_deposit: { label: 'Aguardando Depósito', color: '#f59e0b' },
  open: { label: 'Aberto', color: '#22c55e' },
  in_progress: { label: 'Em Andamento', color: '#3b82f6' },
  awaiting_result: { label: 'Aguardando Resultado', color: '#8b5cf6' },
  completed: { label: 'Concluído', color: '#10b981' },
  cancelled: { label: 'Cancelado', color: '#ef4444' }
};

export function AdminMiniTournaments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<MiniTournament | null>(null);
  const [editStatus, setEditStatus] = useState<MiniTournamentStatus>("draft");

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-mini-tournaments'],
    queryFn: async (): Promise<MiniTournament[]> => {
      const { data, error } = await supabase
        .from('mini_tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get organizer nicknames
      const organizerIds = [...new Set(data?.map(t => t.organizer_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', organizerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.nickname]) || []);

      return (data || []).map(t => ({
        ...t,
        game: t.game as GameType,
        organizer_nickname: profileMap.get(t.organizer_id) || 'Desconhecido'
      }));
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MiniTournamentStatus }) => {
      const { error } = await supabase
        .from('mini_tournaments')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mini torneio atualizado");
      queryClient.invalidateQueries({ queryKey: ['admin-mini-tournaments'] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mini_tournaments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mini torneio removido");
      queryClient.invalidateQueries({ queryKey: ['admin-mini-tournaments'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const filteredTournaments = tournaments.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.organizer_nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-500" />
                Gerenciar Mini Torneios
              </CardTitle>
              <CardDescription>
                Edite ou remova mini torneios da comunidade
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow>
                  <TableHead>Mini Torneio</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum mini torneio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTournaments.map((t) => {
                    const gameInfo = GAME_INFO[t.game];
                    const statusInfo = MINI_STATUS_INFO[t.status];
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>{t.organizer_nickname}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {gameInfo?.name || t.game}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: statusInfo?.color }} className="text-white">
                            {statusInfo?.label || t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {t.current_participants}/{t.max_participants}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-green-500">
                            <Coins className="h-4 w-4" />
                            R$ {Number(t.prize_pool_brl).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(t.start_date), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedTournament(t);
                                setEditStatus(t.status);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedTournament(t);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Mini Torneio</DialogTitle>
            <DialogDescription>
              Altere o status de "{selectedTournament?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as MiniTournamentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending_deposit">Aguardando Depósito</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="awaiting_result">Aguardando Resultado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => selectedTournament && updateMutation.mutate({ id: selectedTournament.id, status: editStatus })}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remover Mini Torneio</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover "{selectedTournament?.title}"? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => selectedTournament && deleteMutation.mutate(selectedTournament.id)}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
