import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizerTournaments } from "@/hooks/useOrganizerParticipants";
import { TournamentParticipantsManager } from "@/components/TournamentParticipantsManager";
import { TournamentStatsCard } from "@/components/TournamentStatsCard";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";
import { EditTournamentDialog } from "@/components/EditTournamentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { 
  Plus, Trophy, Users, Calendar, Coins, Edit, Eye, 
  Trash2, ChevronDown, ExternalLink, Copy, CheckCircle 
} from "lucide-react";
import { GAME_INFO, GameType, STATUS_INFO, Tournament } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Organizer = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { data: myTournaments, isLoading } = useOrganizerTournaments(user?.id);
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["organizer-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Torneio excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir torneio: " + error.message);
    },
  });

  const copyTournamentLink = (id: string) => {
    const url = `${window.location.origin}/tournament/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Remove role restriction - any authenticated user can be an organizer
  const tournaments = myTournaments || [];
  const activeTournaments = tournaments.filter((t) => 
    ["upcoming", "open", "in_progress"].includes(t.status)
  );
  const completedTournaments = tournaments.filter((t) => 
    ["completed", "cancelled"].includes(t.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Dashboard do Organizador
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus torneios, participantes e acompanhe estatísticas
            </p>
          </div>
          
          <CreateTournamentDialog>
            <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold gap-2">
              <Plus className="h-4 w-4" />
              Criar Torneio
            </Button>
          </CreateTournamentDialog>
        </div>
        
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <TournamentStatsCard tournaments={tournaments as Tournament[]} />
          </div>
        )}
        
        {/* Tournaments List */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="active" className="gap-2">
              Ativos ({activeTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              Finalizados ({completedTournaments.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              Todos ({tournaments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <TournamentsList 
              tournaments={activeTournaments} 
              userId={user.id}
              isLoading={isLoading}
              onDelete={(id) => deleteTournament.mutate(id)}
              onCopyLink={copyTournamentLink}
              copiedId={copiedId}
            />
          </TabsContent>
          
          <TabsContent value="completed">
            <TournamentsList 
              tournaments={completedTournaments} 
              userId={user.id}
              isLoading={isLoading}
              onDelete={(id) => deleteTournament.mutate(id)}
              onCopyLink={copyTournamentLink}
              copiedId={copiedId}
            />
          </TabsContent>
          
          <TabsContent value="all">
            <TournamentsList 
              tournaments={tournaments} 
              userId={user.id}
              isLoading={isLoading}
              onDelete={(id) => deleteTournament.mutate(id)}
              onCopyLink={copyTournamentLink}
              copiedId={copiedId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface TournamentsListProps {
  tournaments: any[];
  userId: string;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onCopyLink: (id: string) => void;
  copiedId: string | null;
}

function TournamentsList({ tournaments, userId, isLoading, onDelete, onCopyLink, copiedId }: TournamentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-16">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum torneio encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro torneio e comece a receber inscrições!
            </p>
            <CreateTournamentDialog>
              <Button className="bg-gradient-primary hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Torneio
              </Button>
            </CreateTournamentDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-4">
      {tournaments.map((tournament) => {
        const gameInfo = GAME_INFO[tournament.game as GameType];
        const statusInfo = STATUS_INFO[tournament.status];
        
        return (
          <AccordionItem 
            key={tournament.id} 
            value={tournament.id}
            className="border border-border/50 rounded-xl overflow-hidden bg-card"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-4 w-full">
                <div className="text-3xl">{gameInfo?.icon}</div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-foreground truncate">
                      {tournament.title}
                    </h3>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: statusInfo?.color,
                        color: statusInfo?.color 
                      }}
                    >
                      {statusInfo?.label}
                    </Badge>
                    {tournament.is_highlighted && (
                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        ⭐ Destaque
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {tournament.entry_fee > 0 
                        ? `R$ ${(tournament.entry_fee / 100).toFixed(2).replace('.', ',')}` 
                        : "Grátis"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tournament.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onCopyLink(tournament.id)}
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
                  <EditTournamentDialog tournament={tournament}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditTournamentDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Torneio</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o torneio "{tournament.title}"? 
                          Todos os participantes serão removidos. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(tournament.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-6 pb-6">
              <div className="pt-4 border-t border-border/50">
                <TournamentParticipantsManager
                  tournamentId={tournament.id}
                  tournamentTitle={tournament.title}
                  isOrganizer={tournament.organizer_id === userId}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export default Organizer;
