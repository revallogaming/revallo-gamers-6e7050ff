"use client";

import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { 
  Wallet, 
  Trophy, 
  Settings, 
  User, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  Zap
} from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";

export default function PainelPage() {
  const { user, profile } = useAuth();

  if (!user) return null;

  const quickActions = [
    {
      title: "Financeiro",
      description: "Gerenciar saldo, saques e depósitos",
      icon: Wallet,
      href: "/financeiro",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Meus Torneios",
      description: "Gerenciar campeonatos e participantes",
      icon: Trophy,
      href: "/organizer",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Configurações",
      description: "Dados da conta, privacidade e segurança",
      icon: Settings,
      href: "/configuracoes",
      color: "text-gray-400",
      bgColor: "bg-gray-400/10",
    },
    {
      title: "Meu Perfil Público",
      description: "Ver como os outros vêem seu perfil",
      icon: User,
      href: `/perfil/${profile?.nickname || user.uid}`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] bg-nebula text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      <SEO title="Painel do Usuário - Revallo" />
      <Header />

      <main className="container py-12 mx-auto px-4 relative z-10 max-w-5xl">
        <header className="mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">
            Painel de Controle
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Bem-vindo de volta, <span className="text-white">{profile?.nickname || "Gamer"}</span>.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="bg-[#050505] border-white/5 rounded-none p-8 hover:bg-white/2 transition-all group flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`h-14 w-14 rounded-full ${action.bgColor} flex items-center justify-center`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-purple-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </Card>
            </Link>
          ))}
        </div>

        {/* Overview Stats Row */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
           <Card className="bg-[#050505] border-white/5 rounded-none p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Saldo Disponível</span>
                <CreditCard className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-white">
                R$ {((profile?.credits || 0) / 10).toFixed(2)}
              </div>
           </Card>
           
           <Card className="bg-[#050505] border-white/5 rounded-none p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Torneios Ativos</span>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-white">
                --
              </div>
           </Card>

           <Card className="bg-[#050505] border-white/5 rounded-none p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Nível Gamer</span>
                <Zap className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-white">
                PRO
              </div>
           </Card>
        </div>
      </main>
    </div>
  );
}
