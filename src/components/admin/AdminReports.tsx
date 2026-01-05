import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, Flag, Eye, Trash2, User, Trophy, Gamepad2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Report {
  id: string;
  reporter_id: string;
  report_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter_nickname?: string;
  target_name?: string;
}

const STATUS_INFO: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "destructive" },
  reviewed: { label: "Em Análise", variant: "secondary" },
  resolved: { label: "Resolvido", variant: "default" },
  dismissed: { label: "Descartado", variant: "outline" },
};

const REASON_LABELS: Record<string, string> = {
  fraud: "Fraude / Golpe",
  misleading: "Informações enganosas",
  inappropriate: "Conteúdo inapropriado",
  spam: "Spam",
  harassment: "Assédio / Bullying",
  impersonation: "Falsidade ideológica",
  cheating: "Trapaça em jogos",
  other: "Outro",
};

const TYPE_INFO: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  tournament: { label: "Torneio", icon: Trophy },
  mini_tournament: { label: "Mini Torneio", icon: Gamepad2 },
  user: { label: "Usuário", icon: User },
};

export function AdminReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("pending");

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async (): Promise<Report[]> => {
      const { data: reportsData, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get reporter nicknames
      const reporterIds = [...new Set(reportsData?.map((r) => r.reporter_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", reporterIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.nickname]) || []);

      // Get target names based on type
      const tournamentIds = reportsData?.filter((r) => r.report_type === "tournament").map((r) => r.target_id) || [];
      const miniTournamentIds = reportsData?.filter((r) => r.report_type === "mini_tournament").map((r) => r.target_id) || [];
      const userIds = reportsData?.filter((r) => r.report_type === "user").map((r) => r.target_id) || [];

      const [tournamentsRes, miniTournamentsRes, usersRes] = await Promise.all([
        tournamentIds.length > 0
          ? supabase.from("tournaments").select("id, title").in("id", tournamentIds)
          : { data: [] as { id: string; title: string }[] },
        miniTournamentIds.length > 0
          ? supabase.from("mini_tournaments").select("id, title").in("id", miniTournamentIds)
          : { data: [] as { id: string; title: string }[] },
        userIds.length > 0
          ? supabase.from("profiles").select("id, nickname").in("id", userIds)
          : { data: [] as { id: string; nickname: string }[] },
      ]);

      const tournamentMap = new Map<string, string>(
        (tournamentsRes.data || []).map((t) => [t.id, t.title])
      );
      const miniTournamentMap = new Map<string, string>(
        (miniTournamentsRes.data || []).map((t) => [t.id, t.title])
      );
      const userMap = new Map<string, string>(
        (usersRes.data || []).map((u) => [u.id, u.nickname])
      );

      return (reportsData || []).map((r) => {
        let targetName = "Desconhecido";
        if (r.report_type === "tournament") {
          targetName = tournamentMap.get(r.target_id) || "Torneio removido";
        } else if (r.report_type === "mini_tournament") {
          targetName = miniTournamentMap.get(r.target_id) || "Mini torneio removido";
        } else if (r.report_type === "user") {
          targetName = userMap.get(r.target_id) || "Usuário removido";
        }

        return {
          ...r,
          reporter_nickname: profileMap.get(r.reporter_id) || "Desconhecido",
          target_name: targetName,
        };
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia removida");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.reporter_nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

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
                <Flag className="h-5 w-5 text-destructive" />
                Denúncias
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingCount} pendentes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Gerencie denúncias de usuários e torneios</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="reviewed">Em Análise</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="dismissed">Descartados</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Denunciante</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma denúncia encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((r) => {
                    const typeInfo = TYPE_INFO[r.report_type];
                    const statusInfo = STATUS_INFO[r.status];
                    const TypeIcon = typeInfo?.icon || Flag;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{typeInfo?.label || r.report_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">
                          {r.target_name}
                        </TableCell>
                        <TableCell>{r.reporter_nickname}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{REASON_LABELS[r.reason] || r.reason}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo?.variant}>{statusInfo?.label || r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedReport(r);
                                setAdminNotes(r.admin_notes || "");
                                setNewStatus(r.status);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedReport(r);
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

      {/* View/Edit Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
            <DialogDescription>
              Revise e atualize o status da denúncia
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium">{TYPE_INFO[selectedReport.report_type]?.label}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Alvo:</span>
                  <p className="font-medium">{selectedReport.target_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Denunciante:</span>
                  <p className="font-medium">{selectedReport.reporter_nickname}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Motivo:</span>
                  <p className="font-medium">{REASON_LABELS[selectedReport.reason]}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Descrição:</span>
                  <p className="mt-1 p-2 bg-muted rounded-md text-sm">{selectedReport.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="reviewed">Em Análise</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="dismissed">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas do admin</Label>
                <Textarea
                  placeholder="Adicione notas sobre a análise..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                selectedReport &&
                updateMutation.mutate({
                  id: selectedReport.id,
                  status: newStatus,
                  notes: adminNotes,
                })
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remover Denúncia</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta denúncia? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReport && deleteMutation.mutate(selectedReport.id)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
