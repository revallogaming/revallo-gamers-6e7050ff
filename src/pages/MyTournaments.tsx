import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, Calendar, Users, Coins, Edit, Trash2, 
  ExternalLink, Copy, CheckCircle, Plus, ArrowLeft 
} from "lucide-react";
import { GAME_INFO, STATUS_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { EditTournamentDialog } from "@/components/EditTournamentDialog";
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
} from "@/components/ui/alert-dialog";

const MyTournaments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch tournaments created by user
  const { data: createdTournaments, isLoading: loadingCreated } = useQuery({
    queryKey: ["my-created-tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch tournaments user is registered in
  const { data: registeredTournaments, isLoading: loadingRegistered } = useQuery({
    queryKey: ["my-registered-tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("*, tournament:tournaments(*)")
        .eq("player_id", user.id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Delete tournament mutation
  const deleteTournament = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-created-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Torneio excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir torneio: " + error.message);
    },
  });

  // Unregister from tournament
  const unregisterTournament = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("tournament_participants")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("player_id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registered-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Inscrição cancelada!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar inscrição: " + error.message);
    },
  });

  const copyLink = (id: string, type: "tournament") => {
    const url = `${window.location.origin}/tournament/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const TournamentCard = ({ tournament, isOwner = false }: { tournament: any; isOwner?: boolean }) => {
    const gameInfo = GAME_INFO[tournament.game];
    const statusInfo = STATUS_INFO[tournament.status];

    return (
      <Card className="border-border/50 hover:border-primary/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{gameInfo?.icon}</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ borderColor: statusInfo?.color, color: statusInfo?.color }}
                >
                  {statusInfo?.label}
                </Badge>
              </div>
              <Link to={`/tournament/${tournament.id}`}>
                <h3 className="font-display font-bold text-foreground hover:text-primary transition-colors truncate">
                  {tournament.title}
                </h3>
              </Link>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(tournament.start_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {tournament.current_participants}/{tournament.max_participants}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" />
                  {tournament.entry_fee > 0 
                    ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace('.', ',')}` 
                    : "Grátis"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyLink(tournament.id, "tournament")}
                className="h-8 w-8"
              >
                {copiedId === tournament.id ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Link to={`/tournament/${tournament.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              {isOwner && (
                <>
                  <EditTournamentDialog tournament={tournament}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditTournamentDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Torneio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o torneio "{tournament.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTournament.mutate(tournament.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {!isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Inscrição</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar sua inscrição no torneio "{tournament.title}"?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unregisterTournament.mutate(tournament.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancelar Inscrição
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">Meus Torneios</h1>
          <CreateTournamentDialog>
            <Button className="bg-gradient-primary hover:opacity-90 font-semibold gap-2">
              <Plus className="h-4 w-4" />
              Criar Torneio
            </Button>
          </CreateTournamentDialog>
        </div>

        <Tabs defaultValue="registered" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="registered">Inscritos</TabsTrigger>
            <TabsTrigger value="created">Criados por Mim</TabsTrigger>
          </TabsList>

          <TabsContent value="registered">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Torneios que você está inscrito
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRegistered ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : registeredTournaments && registeredTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {registeredTournaments.map((reg) => (
                      <TournamentCard key={reg.id} tournament={reg.tournament} isOwner={false} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">Você ainda não está inscrito em nenhum torneio</p>
                    <Link to="/">
                      <Button className="mt-4" variant="outline">
                        Explorar Torneios
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="created">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  Torneios que você criou
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCreated ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : createdTournaments && createdTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {createdTournaments.map((tournament) => (
                      <TournamentCard key={tournament.id} tournament={tournament} isOwner={true} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">Você ainda não criou nenhum torneio</p>
                    <CreateTournamentDialog>
                      <Button className="mt-4 bg-gradient-primary hover:opacity-90">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Torneio
                      </Button>
                    </CreateTournamentDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyTournaments;
