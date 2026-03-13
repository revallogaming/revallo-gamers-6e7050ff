"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Users, ChevronRight } from "lucide-react";

export function CTA() {
  const router = useRouter();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto rounded-[48px] bg-[#0F0F18] border border-white/10 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          {/* Internal Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full" />

          <div className="relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">
                SUA CARREIRA <br />
                <span className="text-primary">COMEÇA AQUI</span>
              </h2>
              <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto italic">
                Não seja apenas mais um jogador. Entre para a elite, conquiste
                seu espaço e seja pago por suas habilidades.{" "}
                <span className="text-white">
                  O próximo Apostado começa em minutos.
                </span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              <Button
                size="lg"
                onClick={() => router.push("/auth")}
                className="w-full sm:w-auto px-16 h-16 rounded-2xl text-xl font-black italic uppercase tracking-widest text-white transition-all shadow-revallo-glow hover:scale-105 active:scale-95"
                style={{
                  background:
                    "linear-gradient(90deg, #6C5CE7 0%, #A99CFF 100%)",
                }}
              >
                ENTRAR AGORA
              </Button>

              <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">
                <span className="flex items-center gap-2 decoration-primary underline decoration-2 underline-offset-4">
                  GRÁTIS PARA SEMPRE
                </span>
                <span className="flex items-center gap-2">SAQUES VIA PIX</span>
                <span className="flex items-center gap-2">SUPORTE 24/7</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust Bar / Payment Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all"
        >
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-white italic">
              PIX Instantâneo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-widest text-white italic">
              Plataforma Segura
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users size={20} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest text-white italic">
              Comunidade Ativa
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
