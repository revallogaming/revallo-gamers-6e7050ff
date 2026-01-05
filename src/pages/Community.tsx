import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMiniTournaments } from '@/hooks/useMiniTournaments';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournamentCard } from '@/components/mini-tournaments/MiniTournamentCard';
import { CreateMiniTournamentDialog } from '@/components/mini-tournaments/CreateMiniTournamentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { GAME_INFO, GameType } from '@/types';
import { Search, Plus, Trophy } from 'lucide-react';

export default function Community() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all');
  const [statusTab, setStatusTab] = useState<'open' | 'all'>('open');

  const { tournaments, isLoading } = useMiniTournaments(
    statusTab === 'open' ? { status: 'open' } : undefined
  );

  const filteredTournaments = tournaments?.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = gameFilter === 'all' || t.game === gameFilter;
    return matchesSearch && matchesGame;
  });

  return (
    <>
      <SEO 
        title="Comunidade - Mini Torneios"
        description="Participe de mini torneios comunitários com premiação em dinheiro real via PIX"
      />

      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Comunidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Mini torneios com premiação garantida em R$
            </p>
          </div>

          {user && (
            <CreateMiniTournamentDialog>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Mini Torneio
              </Button>
            </CreateMiniTournamentDialog>
          )}
        </div>

        {/* Stats */}
        <Card className="w-full sm:w-auto sm:max-w-xs">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tournaments?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Torneios Ativos</p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar torneios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={gameFilter} onValueChange={(v) => setGameFilter(v as GameType | 'all')}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Todos os jogos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Jogos</SelectItem>
              {Object.entries(GAME_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>{info.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as 'open' | 'all')}>
          <TabsList>
            <TabsTrigger value="open">Abertos para Inscrição</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={statusTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredTournaments?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum torneio encontrado</p>
                  <p className="text-muted-foreground text-center mt-1">
                    {user ? 'Seja o primeiro a criar um mini torneio!' : 'Volte mais tarde ou crie uma conta para organizar!'}
                  </p>
                  {user && (
                    <CreateMiniTournamentDialog>
                      <Button className="mt-4 gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Mini Torneio
                      </Button>
                    </CreateMiniTournamentDialog>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTournaments?.map(tournament => (
                  <MiniTournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
