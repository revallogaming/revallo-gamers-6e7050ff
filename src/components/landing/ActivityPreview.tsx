"use client";

import { useInfiniteTournaments } from "@/hooks/useInfiniteTournaments";
import { useLFG } from "@/hooks/useLFG";
import { Users, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function ActivityPreview() {
  const { data: tournamentsData } = useInfiniteTournaments();
  const { data: lfgPosts } = useLFG();

  const openTournaments = tournamentsData?.pages[0]?.totalCount || 0;
  const activeSquads = lfgPosts?.length || 0;
  
  // We can add a fallback or a "growth" message if numbers are 0
  const stats = [
    {
      label: "Campeonatos abertos",
      value: openTournaments,
      icon: <Trophy size={20} className="text-yellow-500" />,
      suffix: "",
    },
    {
      label: "Squads procurando",
      value: activeSquads,
      icon: <Users size={20} className="text-blue-400" />,
      suffix: "",
    },
    {
      label: "Jogadores na Revallo",
      value: 150, // This could be dynamic later, using a solid base for "growth"
      icon: <Zap size={20} className="text-primary" />,
      suffix: "+",
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <h2 className="sr-only">Estatísticas da Plataforma</h2>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 py-8 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-2 mb-1">
            {stat.icon}
            <span className="text-2xl md:text-3xl font-black italic text-white tracking-tighter">
              {stat.value}{stat.suffix}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 italic">
            {stat.label}
          </span>
        </motion.div>
      ))}
      </div>
    </section>
  );
}
