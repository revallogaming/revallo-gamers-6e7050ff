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

  const games = ["Free Fire"];
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
    <div className="min-h-screen bg-[#0A0A0C] text-[#dde2ee]">
      <SEO
        title="ENCONTRE SEU SQUAD - Revallo"
        description="Encontre jogadores e squads para subir de rank na Revallo."
      />
      <Header />

      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5 bg-[#0D0D0F]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-white uppercase mb-4 leading-tight">
              ENCONTRE SEU <span className="text-primary italic transition-all hover:text-primary/80">SQUAD</span>
            </h1>
            <p className="text-xs md:text-base text-gray-400 max-w-2xl mx-auto mb-8 font-black uppercase tracking-[0.3em] italic leading-relaxed">
              A jornada começa aqui.<br />
              Conecte-se com jogadores e domine a partida.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CreateLFGDialog>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-white hover:opacity-90 font-black uppercase italic h-14 px-10 rounded-2xl shadow-lg shadow-primary/20 tracking-widest transition-transform active:scale-95"
                  style={{
                    background: "linear-gradient(90deg, #6C5CE7 0%, #A99CFF 100%)",
                  }}
                >
                  CRIAR MEU SQUAD <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CreateLFGDialog>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/10 text-white hover:bg-white/5 font-black uppercase italic h-14 px-10 rounded-2xl tracking-widest backdrop-blur-md"
                onClick={scrollToResults}
              >
                BUSCAR SQUADS
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section
        ref={resultsRef}
        className="sticky top-0 z-40 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/5 py-4 md:py-6"
      >
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="BUSCAR SQUAD..."
                className="pl-11 bg-white/2 border-white/10 focus:border-primary/50 text-white rounded-2xl h-12 text-xs font-black uppercase tracking-widest italic"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-[150px] bg-white/2 border-white/10 rounded-2xl text-white h-12 text-[10px] font-black uppercase tracking-widest italic flex items-center px-4 opacity-70">
                <Gamepad2 className="w-4 h-4 mr-2 text-primary" />
                <span>Free Fire</span>
              </div>

              <Select
                onValueChange={(val) =>
                  setFilters((f) => ({ ...f, rank: val }))
                }
              >
                <SelectTrigger className="flex-1 md:w-[150px] bg-white/2 border-white/10 rounded-2xl text-white focus:ring-primary/20 h-12 text-[10px] font-black uppercase tracking-widest italic">
                  <Trophy className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="RANK" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D0D0F] border-white/10 text-white rounded-xl">
                  {ranks.map((rank) => (
                    <SelectItem key={rank} value={rank} className="font-black uppercase tracking-widest italic text-[10px] focus:bg-primary/10">
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                className="hidden md:flex text-gray-500 hover:text-white rounded-2xl h-12 px-4 hover:bg-white/5"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Squads */}
      <section className="py-12 mx-auto container px-4 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/2 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[350px] bg-white/2 animate-pulse border border-white/5 rounded-3xl"
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
                <Card className="bg-[#0D0D0F]/40 backdrop-blur-xl border-white/5 rounded-3xl hover:border-primary/30 transition-all group overflow-hidden relative shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-xl py-1 px-3 font-black uppercase text-[9px] tracking-widest italic">
                        {ad.game}
                      </Badge>
                      <div className="flex items-center text-[10px] text-gray-600 font-black uppercase tracking-widest italic">
                        <Users className="w-3.5 h-3.5 mr-2 text-primary" />
                        {ad.slots.filter((s) => s.filled).length}/
                        {ad.slots.length}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors leading-[0.9]">
                      {ad.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-[9px] font-black uppercase tracking-widest text-gray-600 italic">
                      <span className="flex items-center gap-1.5 bg-white/2 px-2 py-1 rounded-lg">
                        <Trophy className="w-3.5 h-3.5 text-primary" />{" "}
                        {ad.rank}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/2 px-2 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-primary" />{" "}
                        {ad.region}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0">
                    <p className="text-gray-400 text-sm mb-8 line-clamp-2 italic font-medium leading-relaxed">
                      "{ad.description}"
                    </p>

                    <div className="space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-700 font-black mb-4 italic">
                        RECRUTAMENTO ATIVO:
                      </p>
                      {ad.slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${slot.filled ? "border-white/2 bg-white/2 opacity-30" : "border-primary/10 bg-primary/5"}`}
                        >
                          <span
                            className={`text-[11px] font-black uppercase tracking-tighter italic ${slot.filled ? "text-gray-500" : "text-white"}`}
                          >
                            {slot.role}
                          </span>
                          {!slot.filled ? (
                            <Button
                              size="sm"
                              className="h-8 text-[9px] bg-primary text-white hover:opacity-90 rounded-xl font-black uppercase tracking-widest px-4 italic"
                              onClick={() =>
                                joinLFG.mutate({
                                  lfgId: ad.id,
                                  slotIndex: idx,
                                })
                              }
                            >
                              SOLICITAR VAGA
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-white/10 text-gray-600 text-[8px] font-black uppercase tracking-widest rounded-lg h-6 px-3 italic"
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
                        className="w-12 h-12 rounded-2xl border-2 border-primary/20 transition-all object-cover"
                      />
                      <div>
                        <p className="text-[13px] font-black italic uppercase tracking-tighter text-white leading-none">
                          {ad.authorName}
                        </p>
                        <p className="text-[9px] text-gray-600 font-black mt-1 uppercase tracking-widest italic">
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
          <div className="text-center py-24 border border-dashed border-white/5 bg-white/2 rounded-[48px]">
            <Users className="w-16 h-16 text-gray-800 mx-auto mb-6" />
            <h4 className="text-xl font-black italic uppercase tracking-tighter text-gray-500">
              Nenhum squad recrutando.
            </h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-800 italic mt-2">
              Seja o primeiro a formar sua equipe!
            </p>
            <Button
              variant="link"
              className="text-primary mt-4 font-black uppercase tracking-widest text-[10px] italic"
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
