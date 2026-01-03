import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useTournaments, useCreateTournament } from "@/hooks/useTournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, Users, Calendar, Coins, Edit, Eye } from "lucide-react";
import { GAME_INFO, GameType, STATUS_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const Organizer = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const { data: allTournaments } = useTournaments();
  const createTournament = useCreateTournament();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "" as GameType | "",
    rules: "",
    prize_description: "",
    entry_fee: 0,
    max_participants: 32,
    start_date: "",
    registration_deadline: "",
    banner_url: null as string | null,
    organizer_pix_key: "",
  });

  // Filter tournaments by organizer
  const myTournaments = allTournaments?.filter((t) => t.organizer_id === user?.id) || [];

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

  if (!hasRole("organizer") && !hasRole("admin")) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Você precisa ser um organizador para acessar esta página.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Entre em contato com a administração para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.game || !formData.title || !formData.start_date || !formData.registration_deadline) {
      return;
    }

    try {
      await createTournament.mutateAsync({
        ...formData,
        game: formData.game as GameType,
        organizer_id: user.id,
        status: "upcoming",
        is_highlighted: false,
        highlighted_until: null,
        end_date: null,
        banner_url: formData.banner_url,
        organizer_pix_key: formData.organizer_pix_key || null,
      });
      
      setCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        game: "",
        rules: "",
        prize_description: "",
        entry_fee: 0,
        max_participants: 32,
        start_date: "",
        registration_deadline: "",
        banner_url: null,
        organizer_pix_key: "",
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Painel do Organizador
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus torneios e acompanhe os resultados
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 glow-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Torneio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Criar Novo Torneio</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nome do torneio"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Jogo *</Label>
                    <Select 
                      value={formData.game} 
                      onValueChange={(v) => setFormData({ ...formData, game: v as GameType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o jogo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(GAME_INFO) as GameType[]).map((game) => (
                          <SelectItem key={game} value={game}>
                            {GAME_INFO[game].icon} {GAME_INFO[game].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Máximo de Participantes</Label>
                    <Input
                      type="number"
                      min={2}
                      max={1000}
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label>Taxa de Inscrição (créditos)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.entry_fee}
                      onChange={(e) => setFormData({ ...formData, entry_fee: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label>Data de Início *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Prazo de Inscrição *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o torneio..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Regras</Label>
                    <Textarea
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder="Regras do torneio..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Descrição da Premiação</Label>
                    <Textarea
                      value={formData.prize_description}
                      onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                      placeholder="O que o vencedor ganha..."
                      rows={2}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary"
                  disabled={createTournament.isPending}
                >
                  {createTournament.isPending ? "Criando..." : "Criar Torneio"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <Trophy className="mx-auto h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{myTournaments.length}</div>
              <div className="text-sm text-muted-foreground">Torneios</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto h-8 w-8 text-secondary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {myTournaments.reduce((acc, t) => acc + t.current_participants, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Participantes</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {myTournaments.filter((t) => t.status === "open" || t.status === "upcoming").length}
              </div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <Coins className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {myTournaments.reduce((acc, t) => acc + t.entry_fee * t.current_participants, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Créditos Arrecadados</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tournaments List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="completed">Finalizados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <TournamentsList tournaments={myTournaments} />
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <TournamentsList 
              tournaments={myTournaments.filter((t) => 
                ["upcoming", "open", "in_progress"].includes(t.status)
              )} 
            />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <TournamentsList 
              tournaments={myTournaments.filter((t) => 
                ["completed", "cancelled"].includes(t.status)
              )} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function TournamentsList({ tournaments }: { tournaments: any[] }) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum torneio encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tournaments.map((tournament) => {
        const gameInfo = GAME_INFO[tournament.game];
        const statusInfo = STATUS_INFO[tournament.status];
        
        return (
          <Card key={tournament.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{gameInfo.icon}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">
                      {tournament.title}
                    </h3>
                    <span 
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ 
                        backgroundColor: `${statusInfo.color}20`,
                        color: statusInfo.color 
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {tournament.entry_fee > 0 ? `${tournament.entry_fee} créditos` : "Grátis"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(tournament.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link to={`/tournament/${tournament.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default Organizer;
