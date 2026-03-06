"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowLeft, Search, Zap } from "lucide-react";
import { Header } from "@/components/Header";

export default function NotFound() {
  useEffect(() => {
    console.error("404 Error: Non-existent route accessed.");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center overflow-hidden relative">
      <Header />

      {/* Decorative Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Content Container */}
      <div className="container relative z-10 px-4 flex flex-col items-center text-center">
        {/* Animated Error Icon */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse" />
          <div className="h-40 w-40 rounded-[48px] bg-white/5 border border-white/5 flex items-center justify-center relative z-10 shadow-2xl backdrop-blur-xl">
            <Zap className="h-16 w-16 text-primary fill-primary animate-bounce-slow" />
          </div>
          {/* Glitch 404 text Overlay */}
          <div className="absolute -bottom-6 -right-6 bg-primary text-black font-black italic text-3xl px-6 py-2 rounded-2xl rotate-12 shadow-xl shadow-primary/30">
            404
          </div>
        </div>

        {/* Text Details */}
        <div className="max-w-xl mx-auto space-y-6 mb-16">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
            Rota <span className="text-primary italic">Perdida</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed max-w-sm mx-auto">
            O recurso que você está buscando foi movido para outra dimensão ou
            nunca existiu neste hub.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Link href="/">
            <Button className="bg-primary hover:opacity-90 h-16 px-12 rounded-[24px] font-black italic uppercase text-sm shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
              <ArrowLeft className="h-5 w-5" />
              Base Central
            </Button>
          </Link>
          <Link href="/tournaments">
            <Button
              variant="ghost"
              className="bg-white/5 border border-white/5 hover:bg-white/10 h-16 px-12 rounded-[24px] font-black italic uppercase text-sm transition-all active:scale-95 flex items-center gap-3"
            >
              <Search className="h-5 w-5 text-gray-400" />
              Ver Torneios
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/2 backdrop-blur-md opacity-30">
        <Gamepad2 className="h-3 w-3 text-gray-600" />
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">
          Revallo Ops Status: Active
        </span>
      </div>
    </div>
  );
}
