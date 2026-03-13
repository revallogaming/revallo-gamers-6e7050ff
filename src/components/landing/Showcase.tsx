"use client";

import { motion } from "framer-motion";
import { ChevronRight, Smartphone, Zap, ShieldCheck } from "lucide-react";
import NextImage from "next/image";

const DEMOS = [
  {
    title: "Apostados FF",
    description: "Desafios 1v1, 2v2 e 4v4 instantâneos com premiação automática.",
    image: "/screenshots/apostados_showcase.png",
    icon: Zap,
    color: "text-primary",
  },
  {
    title: "Hub de Torneios",
    description: "Gerenciamento completo de chaves, tabelas e chat exclusivo.",
    image: "/screenshots/tournament.png",
    icon: ShieldCheck,
    color: "text-emerald-400",
  },
];

export function Showcase() {
  return (
    <section className="py-24 bg-[#020106] relative overflow-hidden" id="showcase">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 italic"
          >
            Sinta a experiência
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none"
          >
            A ELITE DO COMPETITIVO <br />
            <span className="text-primary italic">NA PALMA DA MÃO</span>
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="text-gray-500 font-bold uppercase tracking-widest text-sm"
          >
            70% dos nossos jogadores são mobile. 100% da plataforma é otimizada para você.
          </motion.p>
        </div>

        <div className="grid gap-16 lg:gap-32">
          {DEMOS.map((demo, index) => (
            <div 
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24`}
            >
              {/* Text Side */}
              <motion.div 
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 space-y-6 text-center lg:text-left"
              >
                <div className={`w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto lg:mx-0 ${demo.color}`}>
                  <demo.icon size={32} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                  {demo.title}
                </h3>
                <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-lg mx-auto lg:mx-0 italic">
                  {demo.description}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-xs font-black uppercase tracking-widest text-primary italic">Ver demonstração</span>
                    <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Image Side */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex-1 relative group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-[#0D0B1A] aspect-[16/10]">
                  <NextImage 
                    src={demo.image} 
                    alt={demo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
                
                {/* Floating Elements (Visual Polish) */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 hidden md:flex items-center gap-3 p-4 rounded-2xl bg-[#1A1A24] border border-white/10 shadow-xl backdrop-blur-xl"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Atividade em Tempo Real</span>
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full translate-x-1/2" />
    </section>
  );
}
