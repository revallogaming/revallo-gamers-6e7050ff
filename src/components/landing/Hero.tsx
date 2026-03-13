"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Play, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const router = useRouter();

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-revallo-purple/20 blur-[60px] md:blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-revallo-glow/15 blur-[60px] md:blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-6 leading-[0.9] drop-shadow-2xl font-orbitron">
              Domine o <span className="text-primary italic">Competitivo</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-medium mb-10 max-w-xl mx-auto leading-relaxed font-rajdhani">
              O lugar onde lendas nascem. Participe de torneios, encontre seu squad e conquiste a glória no cenário de Free Fire.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Button 
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto bg-primary hover:opacity-90 h-16 px-12 rounded-2xl font-black italic uppercase text-lg shadow-2xl shadow-primary/40 flex items-center gap-3 group transition-all hover:scale-105 active:scale-95 font-rajdhani"
              >
                ENTRAR AGORA
                <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>

          {/* Simple How it Works Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 max-w-4xl mx-auto border-y border-white/5"
          >
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-14 h-14 rounded-[20px] bg-revallo-purple/10 flex items-center justify-center text-revallo-purple border border-revallo-purple/20 group-hover:scale-110 transition-transform shadow-revallo-glow/10">
                <User size={24} className="text-primary italic" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 italic">PASSO 01</p>
                <p className="text-sm font-black uppercase tracking-widest italic text-white leading-tight">
                  CRIE SUA CONTA
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="w-14 h-14 rounded-[20px] bg-revallo-purple/10 flex items-center justify-center text-revallo-purple border border-revallo-purple/20 group-hover:scale-110 transition-transform shadow-revallo-glow/10">
                <Trophy size={24} className="text-primary italic" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 italic">PASSO 02</p>
                <p className="text-sm font-black uppercase tracking-widest italic text-white leading-tight">
                  ENTRE EM UM<br />CAMPEONATO
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 group">
              <div className="w-14 h-14 rounded-[20px] bg-revallo-purple/10 flex items-center justify-center text-revallo-purple border border-revallo-purple/20 group-hover:scale-110 transition-transform shadow-revallo-glow/10">
                <Wallet size={24} className="text-primary italic" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 italic">PASSO 03</p>
                <p className="text-sm font-black uppercase tracking-widest italic text-white leading-tight">
                  GANHE E SAQUE<br />VIA PIX
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-black italic uppercase tracking-widest text-emerald-400">
                Torneios e Comunidades ativas agora
              </span>
            </div>

            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.2em] italic">
              Mais de 500 jogadores <br />
              já estão competindo na Revallo.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
