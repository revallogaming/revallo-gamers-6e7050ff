"use client";

import React, { useState } from "react";
import { useLFG, useLFGActions, LFGPost } from "@/hooks/useLFG";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  MapPin,
  Gamepad2,
  Trophy,
  Filter,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { CreateLFGDialog } from "@/components/CreateLFGDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LFGPage() {
  const [filters, setFilters] = useState({ game: "Todos", rank: "Todos" });
  const { data: ads, isLoading } = useLFG(filters);
  const { joinLFG } = useLFGActions();
  const { user } = useAuth();
  const router = useRouter();
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const games = ["Todos", "Free Fire", "Valorant", "Blood Strike", "COD Warzone", "Outros"];
  const ranks = [
    "Todos",
    "Ferro",
    "Bronze",
    "Prata",
    "Ouro",
    "Platina",
    "Diamante",
    "Ascendente",
    "Imortal",
    "Radiante",
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#dde2ee]">
      <SEO
        title="ENCONTRE SEU SQUAD - Revallo"
        description="Encontre jogadores e squads para subir de rank na Revallo."
      />
      <Header />

      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#b8ff00]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase mb-4 leading-tight">
              ENCONTRE SEU <span className="text-[#b8ff00]">SQUAD</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-8 font-mono uppercase tracking-widest leading-relaxed">
              A jornada começa aqui.<br />
              Conecte-se com jogadores e entre na partida.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <CreateLFGDialog>
                <Button
                  size="lg"
                  className="bg-[#b8ff00] text-black hover:bg-[#a3e600] font-black uppercase italic h-14 px-8 rounded-none border-b-4 border-black/20"
                >
                  CRIAR MEU SQUAD <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CreateLFGDialog>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 font-black uppercase italic h-14 px-8 rounded-none"
                onClick={scrollToResults}
              >
                BUSCAR TALENTOS
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section
        ref={resultsRef}
        className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 py-6"
      >
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome do squad..."
                className="pl-10 bg-[#111115] border-white/5 focus:border-[#b8ff00]/50 text-white rounded-none h-12"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Select
                onValueChange={(val) =>
                  setFilters((f) => ({ ...f, game: val }))
                }
              >
                <SelectTrigger className="w-[180px] bg-[#111115] border-white/5 rounded-none text-white focus:ring-[#b8ff00]/20 h-12">
                  <Gamepad2 className="w-4 h-4 mr-2 text-[#b8ff00]" />
                  <SelectValue placeholder="Jogo" />
                </SelectTrigger>
                <SelectContent className="bg-[#111115] border-white/10 text-white">
                  {games.map((game) => (
                    <SelectItem key={game} value={game}>
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) =>
                  setFilters((f) => ({ ...f, rank: val }))
                }
              >
                <SelectTrigger className="w-[180px] bg-[#111115] border-white/5 rounded-none text-white focus:ring-[#b8ff00]/20 h-12">
                  <Trophy className="w-4 h-4 mr-2 text-[#b8ff00]" />
                  <SelectValue placeholder="Rank" />
                </SelectTrigger>
                <SelectContent className="bg-[#111115] border-white/10 text-white">
                  {ranks.map((rank) => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white rounded-none h-12"
              >
                <Filter className="w-4 h-4 mr-2" /> Filtros
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Squads */}
      <section className="py-12 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mx-auto container px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[300px] bg-[#111115] animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {ads?.map((ad) => (
              <motion.div key={ad.id} variants={item}>
                <Card className="bg-[#111115] border-white/5 rounded-none hover:border-[#b8ff00]/30 transition-all group overflow-hidden relative shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#b8ff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className="bg-[#b8ff00]/10 text-[#b8ff00] border border-[#b8ff00]/20 rounded-none py-1.5 px-3 font-black uppercase text-[10px] tracking-widest">
                        {ad.game}
                      </Badge>
                      <div className="flex items-center text-[10px] text-gray-500 font-mono font-black uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 mr-2 text-primary" />
                        {ad.slots.filter((s) => s.filled).length}/
                        {ad.slots.length}
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-[#b8ff00] transition-colors leading-none">
                      {ad.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-[#b8ff00]" />{" "}
                        {ad.rank}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#b8ff00]" />{" "}
                        {ad.region}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0">
                    <p className="text-gray-400 text-sm mb-8 line-clamp-2 italic font-medium leading-relaxed">
                      "{ad.description}"
                    </p>

                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8ff00]/60 font-black mb-4">
                        Vagas Abertas:
                      </p>
                      {ad.slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-4 border ${slot.filled ? "border-white/5 bg-white/2 opacity-40" : "border-[#b8ff00]/10 bg-[#b8ff00]/5"} transition-all`}
                        >
                          <span
                            className={`text-xs font-black uppercase tracking-widest ${slot.filled ? "text-gray-500" : "text-white"}`}
                          >
                            {slot.role}
                          </span>
                          {!slot.filled ? (
                            <Button
                              size="sm"
                              className="h-8 text-[9px] bg-[#b8ff00] text-black hover:bg-white rounded-none font-black uppercase tracking-widest px-4"
                              onClick={() =>
                                joinLFG.mutate({
                                  lfgId: ad.id,
                                  slotIndex: idx,
                                })
                              }
                            >
                              QUERO ENTRAR
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-white/10 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-none h-6 px-3"
                            >
                              PREENCHIDO
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
                      <img
                        src={ad.authorPhoto || "https://avatar.vercel.sh/user"}
                        alt={ad.authorName}
                        className="w-12 h-12 rounded-full border-2 border-[#b8ff00]/20 grayscale hover:grayscale-0 transition-all"
                      />
                      <div>
                        <p className="text-sm font-black italic uppercase tracking-tighter text-white leading-none">
                          {ad.authorName}
                        </p>
                        <p className="text-[9px] text-gray-600 font-bold mt-1 uppercase tracking-widest">
                          Capitão do Squad
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && ads?.length === 0 && (
          <div className="text-center py-32 border border-dashed border-white/5 bg-white/2">
            <Users className="w-16 h-16 text-gray-800 mx-auto mb-6" />
            <p className="text-2xl font-black italic uppercase tracking-tighter text-gray-500">
              Nenhum squad recrutando no momento.
            </p>
            <Button
              variant="link"
              className="text-[#b8ff00] mt-4 font-black uppercase tracking-widest text-xs"
              onClick={() => setFilters({ game: "Todos", rank: "Todos" })}
            >
              LIMPAR FILTROS
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
