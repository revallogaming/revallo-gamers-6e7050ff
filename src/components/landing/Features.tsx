"use client";

import { Zap, ShieldCheck, Coins, Trophy, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Apostados 24/7",
    description: "Crie ou entre em desafios 1x1, 2x2 ou 4x4 a qualquer hora. Sistema automatizado de chaves e resultados.",
    icon: <Zap size={32} className="text-primary" />,
    color: "from-primary/10 to-transparent",
  },
  {
    title: "Saque Via PIX",
    description: "Ganhou, sacou. Sem burocracia. Receba suas premiações instantaneamente via PIX direto na sua conta.",
    icon: <Coins size={32} className="text-emerald-500" />,
    color: "from-emerald-500/10 to-transparent",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-transparent relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6"
          >
            POR QUE JOGAR NA <br />
            <span className="text-primary italic">REVALLO?</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto"
          >
            A única plataforma que valoriza seu tempo e sua gameplay.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[32px] bg-white/[0.03] border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-revallo-glow/5">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 font-bold text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
