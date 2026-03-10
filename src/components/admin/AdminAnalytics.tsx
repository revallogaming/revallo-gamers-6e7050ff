"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function AdminAnalytics() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const [
        profilesSn,
        tournamentsSn,
        miniTournamentsSn,
        transactionsSn,
        statsSn
      ] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'tournaments')),
        getDocs(collection(db, 'mini_tournaments')),
        getDocs(collection(db, 'credit_transactions')),
        getDocs(collection(db, 'site_stats')),
      ]);

      const now = new Date();
      const lastNDays = Array.from({ length: period }, (_, i) => {
        const date = subDays(startOfDay(now), i);
        const dayKey = format(date, 'yyyy-MM-dd');
        return {
          date: format(date, 'dd/MM'),
          dayKey,
          rawDate: date,
          users: 0,
          tournaments: 0,
          transactions: 0,
          visitors: 0,
          visitors_logged: 0,
          visitors_guest: 0,
          nonRegistered: 0,
        };
      }).reverse();

      const profiles = profilesSn.docs.map(d => d.data());
      const tournaments = tournamentsSn.docs.map(d => d.data());
      const miniTournaments = miniTournamentsSn.docs.map(d => d.data());
      const transactions = transactionsSn.docs.map(d => d.data());
      const stats = statsSn.docs.reduce((acc, d) => ({ ...acc, [d.id]: d.data() }), {} as Record<string, any>);

      // User Growth
      profiles.forEach(p => {
        if (!p.created_at) return;
        const date = typeof p.created_at === 'string' ? parseISO(p.created_at) : p.created_at.toDate();
        const dayStr = format(date, 'dd/MM');
        const day = lastNDays.find(d => d.date === dayStr);
        if (day) day.users++;
      });

      // Website Visitors & Conversion
      lastNDays.forEach(day => {
        const dayStats = stats[day.dayKey];
        if (dayStats) {
          day.visitors = dayStats.visitors || 0;
          day.visitors_logged = dayStats.visitors_logged || 0;
          day.visitors_guest = dayStats.visitors_guest || 0;
          day.nonRegistered = Math.max(0, day.visitors - day.users);
        }
      });

      // Tournament Activity
      tournaments.forEach(t => {
        if (!t.created_at) return;
        const date = typeof t.created_at === 'string' ? parseISO(t.created_at) : t.created_at.toDate();
        const dayStr = format(date, 'dd/MM');
        const day = lastNDays.find(d => d.date === dayStr);
        if (day) day.tournaments++;
      });
      
      miniTournaments.forEach(t => {
        if (!t.created_at) return;
        const date = typeof t.created_at === 'string' ? parseISO(t.created_at) : t.created_at.toDate();
        const dayStr = format(date, 'dd/MM');
        const day = lastNDays.find(d => d.date === dayStr);
        if (day) day.tournaments++;
      });

      // Transactions Volume
      transactions.forEach(t => {
        if (!t.created_at) return;
        const date = typeof t.created_at === 'string' ? parseISO(t.created_at) : t.created_at.toDate();
        const dayStr = format(date, 'dd/MM');
        const day = lastNDays.find(d => d.date === dayStr);
        if (day) day.transactions += Math.abs(t.amount || 0);
      });

      // Games Distribution
      const gamesMap: Record<string, number> = {};
      tournaments.forEach(t => {
        const game = t.game || 'Outros';
        gamesMap[game] = (gamesMap[game] || 0) + 1;
      });
      miniTournaments.forEach(t => {
        const game = t.game || 'Outros';
        gamesMap[game] = (gamesMap[game] || 0) + 1;
      });

      const gamesData = Object.entries(gamesMap).map(([name, value]) => ({ name, value }));

      return {
        dailyData: lastNDays,
        gamesData
      };
    }
  });

  const selectedDayData = useMemo(() => {
    if (!selectedDay || !analytics?.dailyData) return null;
    return analytics.dailyData.find(d => d.dayKey === selectedDay || d.date === selectedDay);
  }, [selectedDay, analytics?.dailyData]);

  const todayData = useMemo(() => {
    if (!analytics?.dailyData) return null;
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    return analytics.dailyData.find(d => d.dayKey === todayKey);
  }, [analytics?.dailyData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[350px] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/50 bg-primary/10 backdrop-blur-md rounded-2xl shadow-glow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase italic tracking-widest text-primary/80 mb-1">Visitantes Hoje</p>
            <p className="text-3xl font-black italic text-white leading-none">{todayData?.visitors || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/50 bg-blue-500/10 backdrop-blur-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase italic tracking-widest text-blue-400 mb-1">Inscritos Hoje</p>
            <p className="text-3xl font-black italic text-white leading-none">{todayData?.users || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/50 bg-green-500/10 backdrop-blur-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase italic tracking-widest text-green-400 mb-1">Conversão Hoje</p>
            <div className="flex items-end gap-2 text-white">
              <p className="text-3xl font-black italic leading-none">
                {todayData && todayData.visitors > 0 
                  ? Math.round((todayData.users / todayData.visitors) * 100) 
                  : 0}%
              </p>
              <p className="text-[8px] font-bold uppercase mb-1 opacity-50">Taxa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50 bg-orange-500/10 backdrop-blur-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase italic tracking-widest text-orange-400 mb-1">Logados / Convidados</p>
            <p className="text-2xl font-black italic text-white leading-none">
              {todayData?.visitors_logged || 0} / {todayData?.visitors_guest || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-[24px] backdrop-blur-xl mb-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black uppercase italic tracking-widest text-gray-400">Período:</p>
          {[7, 30, 90].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${
                period === p 
                  ? "bg-primary text-white shadow-glow-sm" 
                  : "bg-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              {p} Dias
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs font-black uppercase italic tracking-widest text-gray-400">Destaque:</p>
          <select 
            className="bg-white/5 border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase italic text-white outline-none"
            value={selectedDay || ""}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">Geral ({period} dias)</option>
            {analytics?.dailyData?.slice().reverse().map(d => (
              <option key={d.dayKey} value={d.dayKey}>{d.date} - {d.visitors} Visitantes</option>
            ))}
          </select>
        </div>
      </div>

      {selectedDayData && (
        <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-primary">
              Estatísticas Detalhadas: {selectedDayData.date}
            </CardTitle>
            <button 
              onClick={() => setSelectedDay(null)}
              className="text-[10px] font-black uppercase italic text-gray-400 hover:text-white transition-colors"
            >
              Fechar Detalhes
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase italic text-gray-500 mb-1">Visitantes</p>
                <p className="text-3xl font-black italic text-white">{selectedDayData.visitors}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase italic text-gray-500 mb-1">Novos Usuários</p>
                <p className="text-3xl font-black italic text-primary">{selectedDayData.users}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase italic text-gray-500 mb-1">Torneios</p>
                <p className="text-3xl font-black italic text-blue-500">{selectedDayData.tournaments}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase italic text-gray-500 mb-1">Logados / Convidados</p>
                <p className="text-3xl font-black italic text-white">
                  {selectedDayData.visitors_logged} / {selectedDayData.visitors_guest}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase italic text-gray-500 mb-1">Conversão</p>
                <p className="text-3xl font-black italic text-green-500">
                  {selectedDayData.visitors > 0 
                    ? Math.round((selectedDayData.users / selectedDayData.visitors) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black italic uppercase tracking-wider text-muted-foreground">Visitantes Totais ({period}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black italic text-white">
              {analytics?.dailyData.reduce((sum, d) => sum + d.visitors, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black italic uppercase tracking-wider text-muted-foreground">Novos Usuários ({period}d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black italic text-primary">
              {analytics?.dailyData.reduce((sum, d) => sum + d.users, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visitors vs Non-Registrations Chart */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm col-span-full">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-white">Conversão: Visitantes vs Não-Registrados</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNonReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Legend />
                <Area 
                  name="Visitantes Totais"
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                  strokeWidth={2}
                />
                <Area 
                  name="Não Criaram Conta"
                  type="monotone" 
                  dataKey="nonRegistered" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorNonReg)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-white">Crescimento de Usuários ({period}d)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tournament Activity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-white">Atividade de Torneios ({period}d)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="tournaments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Volume */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-white">Volume de Transações (Créditos)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyData}>
                <defs>
                  <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  formatter={(value: any) => [`R$ ${value}`, 'Volume']}
                />
                <Area 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorTrans)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Games Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black italic uppercase tracking-wider text-white">Distribuição por Jogo</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.gamesData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(analytics?.gamesData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
