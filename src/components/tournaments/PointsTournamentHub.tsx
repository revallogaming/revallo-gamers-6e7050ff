"use client";

import { useState, useMemo } from "react";
import { 
  Trophy, Users, Info, Calendar, Clock, 
  ChevronRight, Medal, Star, TrendingUp, 
  BarChart2, MapPin, Hash, CheckCircle2, 
  AlertCircle, Play, Share2, Download,
  LayoutDashboard, ListOrdered, GraduationCap,
  Shield, Timer, Flame, Crown
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizerGuide } from "@/components/organizer/OrganizerGuide";
import { Progress } from "@/components/ui/progress";
import { 
  Tournament, 
  TournamentFall, 
  FallResult, 
  TournamentParticipant,
  GAME_INFO,
  STATUS_INFO
} from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  useTournamentFalls, 
  useTournamentResults, 
  useInitializeFalls 
} from "@/hooks/usePointsTournament";
import { calculateLeaderboard, LeaderboardEntry } from "@/lib/tournament-logic";
import { BatchReportDialog } from "./BatchReportDialog";
import { toast } from "sonner";

interface PointsTournamentHubProps {
  tournament: Tournament;
  participants: TournamentParticipant[];
  isOrganizer: boolean;
}

export function PointsTournamentHub({ 
  tournament, 
  participants, 
  isOrganizer 
}: PointsTournamentHubProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: falls, isLoading: loadingFalls } = useTournamentFalls(tournament.id);
  const { data: results, isLoading: loadingResults } = useTournamentResults(tournament.id);
  const initializeFalls = useInitializeFalls();

  const gameInfo = GAME_INFO[tournament.game];
  
  // Calculate Leaderboard
  const leaderboard = useMemo(() => {
    if (!participants || !results || !tournament.scoring_config) return [];
    return calculateLeaderboard(participants, results, tournament.scoring_config);
  }, [participants, results, tournament.scoring_config]);

  // Handle initialization of falls if empty
  const handleInitialize = () => {
    if (!tournament.total_falls) {
      toast.error("Total de quedas não definido para este torneio.");
      return;
    }
    initializeFalls.mutate({ 
      tournamentId: tournament.id, 
      count: tournament.total_falls 
    });
  };

  const completedFalls = falls?.filter(f => f.status === 'completed').length || 0;
  const totalFalls = tournament.total_falls || falls?.length || 0;
  const progress = (completedFalls / totalFalls) * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tournament Progress Banner */}
      <Card className="bg-[#0D0D0F]/60 border-primary/20 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl shadow-primary/5">
        <div className="h-2 w-full bg-secondary/20 relative">
          <div 
            className="absolute h-full bg-gradient-to-r from-primary to-primary-foreground transition-all duration-1000 shadow-[0_0_20px_rgba(108,92,231,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[28px] animate-pulse group-hover:bg-primary/10 transition-colors" />
                <Trophy className="h-10 w-10 text-primary relative z-10" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic mb-1">Status da Competição</p>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    {completedFalls} <span className="text-primary">/</span> {totalFalls}
                  </h2>
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] uppercase font-black italic tracking-widest px-3">
                    Quedas Concluídas
                  </Badge>
                  {isOrganizer && (
                    <Badge className="bg-primary text-white text-[10px] uppercase font-black italic tracking-widest px-3 ml-2 border-0 shadow-lg shadow-primary/20">
                      Painel do Organizador
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
               {isOrganizer && falls?.length === 0 && (
                 <Button 
                   onClick={handleInitialize}
                   disabled={initializeFalls.isPending}
                   className="bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 border-b-4 border-primary-foreground/20 active:border-b-0 transition-all"
                 >
                   Inicializar Partidas
                 </Button>
               )}
               <Button variant="outline" className="border-white/5 bg-white/2 hover:bg-white/5 text-xs font-black uppercase italic tracking-widest rounded-2xl h-14 px-8 backdrop-blur-md">
                 <Share2 className="h-4 w-4 mr-2" />
                 Compartilhar
               </Button>
               <Button variant="outline" className="border-white/5 bg-white/2 hover:bg-white/5 text-xs font-black uppercase italic tracking-widest rounded-2xl h-14 px-8 backdrop-blur-md">
                 <Download className="h-4 w-4 mr-2" />
                 Planilha Results
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
        <div className="flex items-center justify-center">
          <TabsList className="bg-white/5 p-1.5 rounded-[24px] border border-white/5 h-auto flex flex-wrap max-w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
              { id: 'matches', label: 'Partidas', icon: Timer },
              { id: 'leaderboard', label: 'Ranking Live', icon: ListOrdered },
              { id: 'teams', label: 'Times', icon: Shield },
              { id: 'rules', label: 'Regras', icon: GraduationCap },
              { id: 'stats', label: 'Estatísticas', icon: BarChart2 },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-6 md:px-8 py-4 rounded-[18px] text-[10px] font-black uppercase italic tracking-widest transition-all gap-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content: Overview */}
        <TabsContent value="overview">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Leader Highlight Card */}
              <Card className="bg-gradient-to-br from-[#6C5CE7]/20 to-transparent border-primary/20 backdrop-blur-xl rounded-[40px] overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Crown className="h-32 w-32 text-primary" />
                </div>
                <CardContent className="p-6 md:p-12">
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    <div className="relative">
                      <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary/30 ring-8 ring-primary/5 shadow-2xl shadow-primary/20">
                        <AvatarImage src={leaderboard[0]?.avatarUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary text-4xl font-black italic">
                          {leaderboard[0]?.nickname?.[0]?.toUpperCase() || '#'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-4 -right-4 h-14 w-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl rotate-12 border-2 border-white/20">
                         <Crown className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 mb-2 px-4 py-1 text-[10px] font-black italic uppercase tracking-[0.2em]">LÍDER ATUAL</Badge>
                        <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
                          {leaderboard[0]?.nickname || 'Aguardando...'}
                        </h3>
                        {leaderboard[0]?.teamName && (
                          <p className="text-primary font-black uppercase tracking-widest text-xs italic mt-2 opacity-80">{leaderboard[0].teamName}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-500 italic mb-1">Pontos Totais</p>
                          <p className="text-3xl font-black italic text-white">{leaderboard[0]?.totalPoints || 0}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10 hidden sm:block" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-500 italic mb-1">Total Kills</p>
                          <p className="text-3xl font-black italic text-white">{leaderboard[0]?.totalKills || 0}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10 hidden sm:block" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-500 italic mb-1">Booyahs</p>
                          <p className="text-3xl font-black italic text-white">{leaderboard[0]?.booyahs || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tournament Description */}
              <Card className="bg-[#0D0D0F]/40 border-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden group shadow-2xl">
                <CardHeader className="p-8 pb-0 flex flex-row items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl">
                    <Info className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardTitle className="text-xs font-black italic uppercase tracking-widest text-white">Comunicado da Organização</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-gray-400 leading-relaxed italic">
                    {tournament.description || "Nenhuma descrição adicional foi fornecida."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <Card className="bg-primary/5 border-primary/20 rounded-[32px] overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                 <CardContent className="p-8 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic mb-6">Configuração da Liga</h4>
                    
                    {[
                      { label: 'Sistema de Pontos', value: 'LBFF (Oficial)', icon: ListOrdered },
                      { label: 'Total de Quedas', value: `${totalFalls} Partidas`, icon: Hash },
                      { label: 'Pontos por Kill', value: '1 Ponto', icon: Flame },
                      { label: 'Início', value: format(new Date(tournament.start_date || ""), "dd/MM/yy HH:mm", { locale: ptBR }), icon: Calendar },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                            <stat.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-[0.1em]">{stat.label}</span>
                        </div>
                        <span className="text-xs font-black italic uppercase tracking-tighter text-white">{stat.value}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="bg-[#0D0D0F]/60 border-white/5 rounded-[32px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Próxima Queda</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                   <div className="flex items-center justify-between p-5 bg-white/2 border border-white/5 rounded-[20px] group hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center">
                           <Hash className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                         <p className="text-white font-black italic uppercase tracking-tighter">Queda #{completedFalls + 1}</p>
                         <p className="text-[10px] font-bold text-gray-600 uppercase">Mapa Bermuda</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border-0 uppercase italic font-black text-[9px] tracking-widest">PENDENTE</Badge>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Content: Matches (Timeline) */}
        <TabsContent value="matches">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Timeline da Competição</h3>
               {isOrganizer && (
                 <Button variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] uppercase font-black italic tracking-widest px-6 h-11 rounded-xl">
                   Configurar Mapas
                 </Button>
               )}
            </div>

            <div className="space-y-4 relative">
              <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-white/5 -z-10" />
              
              {falls?.map((fall, index) => {
                const isCompleted = fall.status === 'completed';
                const isLive = fall.status === 'live';
                const isNext = fall.fall_number === completedFalls + 1;

                return (
                  <div key={fall.id} className="flex gap-8 group">
                    <div className={`h-20 w-20 rounded-[24px] border-2 shrink-0 flex items-center justify-center transition-all shadow-xl ${
                      isCompleted ? 'bg-primary border-primary/20 text-white' : 
                      isLive ? 'bg-red-500 border-red-500/20 text-white animate-pulse' :
                      'bg-white/5 border-white/5 text-gray-700'
                    }`}>
                      <span className="text-2xl font-black italic">#{fall.fall_number}</span>
                    </div>

                    <Card className={`flex-1 bg-[#0D0D0F]/60 border-white/5 backdrop-blur-xl rounded-[28px] overflow-hidden transition-all group-hover:bg-white/5 ${
                      isLive ? 'border-red-500/30 ring-1 ring-red-500/20 shadow-2xl shadow-red-500/5' : ''
                    }`}>
                      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-white/2 rounded-2xl flex items-center justify-center">
                             <MapPin className={`h-8 w-8 ${isCompleted ? 'text-primary' : 'text-gray-700'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h4 className="text-lg font-black italic uppercase tracking-tighter text-white">Queda de {index === 0 ? 'Bermuda' : index === 1 ? 'Purgatório' : 'Kalahari'}</h4>
                               <Badge variant="outline" className={`text-[9px] uppercase font-black italic px-2 ${
                                 isCompleted ? 'border-primary/20 text-primary bg-primary/5' :
                                 isLive ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                                 'border-white/10 text-gray-600 bg-white/2'
                               }`}>
                                 {isCompleted ? 'FINALIZADA' : isLive ? 'LIVE' : 'PENDENTE'}
                               </Badge>
                            </div>
                            <p className="text-[10px] font-black uppercase text-gray-600 italic tracking-widest">Mapa Oficial • Sorteado Automaticamente</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                           {isCompleted && (
                             <Button variant="ghost" className="text-[10px] uppercase font-black italic text-gray-500 hover:text-white hover:bg-white/5 rounded-xl px-4">
                               <ListOrdered className="h-4 w-4 mr-2" />
                               Ver Ranking Queda
                             </Button>
                           )}
                           {isOrganizer && (
                             <BatchReportDialog 
                               tournament={tournament}
                               fall={fall}
                               participants={participants}
                             >
                                <Button className={`h-12 px-6 rounded-2xl font-black uppercase italic tracking-widest text-[11px] shadow-lg transition-transform active:scale-95 ${
                                  isCompleted ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' :
                                  'bg-primary text-white hover:opacity-90 shadow-primary/20'
                                }`}>
                                   {isCompleted ? 'Editar Resultado' : 'Reportar Resultado'}
                                </Button>
                             </BatchReportDialog>
                           )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Tab Content: Leaderboard */}
        <TabsContent value="leaderboard">
          <Card className="bg-[#0D0D0F]/60 border-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden shadow-2xl">
             <CardHeader className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">Ranking em Tempo Real</CardTitle>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic mt-2">Atualizado instantaneamente após cada queda vinculada</p>
                </div>
                <div className="flex gap-4">
                   <div className="h-12 px-5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-3">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-black italic uppercase text-primary">Sistema LBFF v1.2</span>
                   </div>
                   <Button variant="outline" className="h-12 rounded-2xl border-white/5 bg-white/5 font-black uppercase italic tracking-widest text-[10px]">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                   </Button>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[700px] md:min-w-0">
                      <thead>
                         <tr className="bg-white/2 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">
                            <th className="px-8 py-6 text-center">Pos</th>
                            <th className="px-8 py-6">Player / Equipe</th>
                            <th className="px-8 py-6 text-center">PTS</th>
                            <th className="px-8 py-6 text-center">Kills</th>
                            <th className="px-8 py-6 text-center">Booyahs</th>
                            <th className="px-8 py-6 text-center">Melhor Pos</th>
                            <th className="px-8 py-6 text-center">Last</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2">
                         {leaderboard.map((entry, idx) => (
                           <tr key={entry.participantId} className="group hover:bg-white/2 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-center">
                                    <div className={`h-11 w-11 rounded-2xl font-black italic flex items-center justify-center text-lg ${
                                       idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20' :
                                       idx === 1 ? 'bg-gray-300 text-gray-800' :
                                       idx === 2 ? 'bg-orange-600 text-white' :
                                       'bg-white/5 text-gray-500 group-hover:text-white transition-colors'
                                    }`}>
                                       #{idx + 1}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-5">
                                    <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:scale-110 transition-transform">
                                       <AvatarImage src={entry.avatarUrl} />
                                       <AvatarFallback className="bg-white/2 text-primary font-black italic">{entry.nickname[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                       <p className="text-base font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">{entry.nickname}</p>
                                       <p className="text-[10px] font-black uppercase text-gray-600 italic tracking-widest">{entry.teamName || 'Solo Player'}</p>
                                    </div>
                                    {idx === 0 && <Crown className="h-4 w-4 text-amber-500 animate-bounce" />}
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="text-xl font-black italic text-primary">{entry.totalPoints}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="text-lg font-black italic text-white/80">{entry.totalKills}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <Badge className={`bg-transparent border-2 font-black italic ${entry.booyahs > 0 ? 'border-amber-500/30 text-amber-500 flex items-center justify-center gap-1' : 'border-gray-500/20 text-gray-800'}`}>
                                    {entry.booyahs} {entry.booyahs > 0 && <Star className="h-2 w-2 fill-amber-500" />}
                                 </Badge>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="text-sm font-black italic text-gray-500">{entry.bestPlacement}º</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <div className="flex items-center justify-center gap-1">
                                    <span className="text-[10px] font-black italic text-gray-600">{entry.lastFallPlacement}º</span>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs omitted for brevity, but would follow the same premium style */}
        <TabsContent value="teams">
           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {participants.map((p) => (
                <Card key={p.id} className="bg-[#0D0D0F]/60 border-white/5 hover:border-primary/20 transition-all rounded-[32px] group overflow-hidden">
                   <CardContent className="p-8">
                      <div className="flex items-center gap-5">
                         <Avatar className="h-16 w-16 border-2 border-white/5 rounded-2xl">
                           <AvatarImage src={p.player?.avatar_url || undefined} />
                           <AvatarFallback className="bg-primary/5 text-primary font-black italic text-xl">{p.player?.nickname?.[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                            <h4 className="text-lg font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">{p.player?.nickname}</h4>
                            <p className="text-[10px] font-black uppercase text-gray-600 italic tracking-widest">{p.team_name || 'Individual'}</p>
                         </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[8px] uppercase font-black italic">Player</Badge>
                         </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-white">
                            <ChevronRight className="h-5 w-5" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card className="bg-[#0D0D0F]/60 border-white/5 backdrop-blur-3xl rounded-[32px] md:rounded-[40px] overflow-hidden">
             <CardContent className="p-6 md:p-12 space-y-8 md:space-y-10">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    Regulamento Oficial
                  </h3>
                  <p className="text-gray-500 italic max-w-2xl">Leia com atenção as regras estabelecidas pela organização para garantir uma competição justa e profissional para todos.</p>
                </div>

                <div className="prose prose-invert max-w-none prose-p:italic prose-p:text-gray-400 prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-widest">
                  {tournament.rules ? (
                    <div className="whitespace-pre-wrap">{tournament.rules}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                       <Shield className="h-16 w-16 mb-4" />
                       <p className="font-black italic uppercase tracking-widest">Aguardando definição de regras</p>
                    </div>
                  )}
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
           <div className="grid gap-8 lg:grid-cols-2">
              <Card className="bg-primary/5 border-primary/10 rounded-[40px] p-10 flex flex-col items-center text-center group">
                 <div className="h-20 w-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 ring-8 ring-primary/5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-10 w-10 text-primary" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic mb-2">Time Mais Consistente</h4>
                 <p className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
                   {leaderboard[0]?.nickname || 'N/A'}
                 </p>
                 <p className="text-gray-500 italic text-sm">Média de posição: 2.3 em todas as quedas</p>
              </Card>

              <Card className="bg-red-500/5 border-red-500/10 rounded-[40px] p-10 flex flex-col items-center text-center group">
                 <div className="h-20 w-20 bg-red-500/10 rounded-[28px] flex items-center justify-center mb-6 ring-8 ring-red-500/5 group-hover:scale-110 transition-transform">
                    <Flame className="h-10 w-10 text-red-500" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 italic mb-2">Maior Kill Game</h4>
                 <p className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
                    {leaderboard[1]?.nickname || 'Indisponível'}
                 </p>
                 <p className="text-gray-500 italic text-sm">14 abates em uma única queda (Queda #2)</p>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
