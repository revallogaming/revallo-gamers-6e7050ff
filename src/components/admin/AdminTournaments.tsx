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
import { Search, RefreshCw, Trophy, Edit, Trash2, Star, Users, FileDown, FileSpreadsheet } from "lucide-react";
import { exportTournamentsToPDF, exportTournamentsToExcel } from "@/lib/exportUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { GAME_INFO, STATUS_INFO, GameType } from "@/types";
import { Database } from "@/integrations/supabase/types";

type TournamentStatus = Database["public"]["Enums"]["tournament_status"];

interface Tournament {
  id: string;
  title: string;
  game: GameType;
  status: TournamentStatus;
  organizer_id: string;
  current_participants: number;
  max_participants: number;
  start_date: string;
  is_highlighted: boolean;
  organizer_nickname?: string;
}

export function AdminTournaments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [editStatus, setEditStatus] = useState<TournamentStatus>("upcoming");

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: async (): Promise<Tournament[]> => {
      const { data, error } = await supabase
        .from('tournaments')
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
    mutationFn: async ({ id, status, is_highlighted }: { id: string; status?: TournamentStatus; is_highlighted?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (is_highlighted !== undefined) {
        updates.is_highlighted = is_highlighted;
        updates.highlighted_until = is_highlighted ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
      }
      
      const { error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Torneio atualizado");
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tournaments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Torneio removido");
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
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
                <Trophy className="h-5 w-5 text-primary" />
                Gerenciar Torneios
              </CardTitle>
              <CardDescription>
                Edite, destaque ou remova torneios
              </CardDescription>
            </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportTournamentsToPDF(filteredTournaments)}
              disabled={filteredTournaments.length === 0}
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportTournamentsToExcel(filteredTournaments)}
              disabled={filteredTournaments.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
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
                  <TableHead>Torneio</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Jogo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum torneio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTournaments.map((t) => {
                    const gameInfo = GAME_INFO[t.game];
                    const statusInfo = STATUS_INFO[t.status];
                    return (
                      <TableRow key={t.id} className={t.is_highlighted ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {t.is_highlighted && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                            <span className="font-medium">{t.title}</span>
                          </div>
                        </TableCell>
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
                                updateMutation.mutate({ id: t.id, is_highlighted: !t.is_highlighted });
                              }}
                            >
                              <Star className={`h-4 w-4 ${t.is_highlighted ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                            </Button>
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
            <DialogTitle>Editar Torneio</DialogTitle>
            <DialogDescription>
              Altere o status de "{selectedTournament?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TournamentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximo</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
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
            <DialogTitle className="text-destructive">Remover Torneio</DialogTitle>
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
