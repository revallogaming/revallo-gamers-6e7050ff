"use client";

import React from "react";
import { Info, HelpCircle, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizerGuideProps {
  type: "tournament-types" | "scoring" | "fees" | "apostados-flow" | "results" | "dashboard-welcome";
  className?: string;
}

export function OrganizerGuide({ type, className }: OrganizerGuideProps) {
  const guides = {
    "tournament-types": {
      icon: <HelpCircle className="h-5 w-5 text-purple-400" />,
      title: "Qual tipo escolher?",
      content: (
        <div className="space-y-2">
          <p>
            <strong className="text-white">Eliminatória:</strong> Ideal para torneios 1v1 ou de curta duração onde o perdedor sai na hora.
          </p>
          <p>
            <strong className="text-white">Pontos (Battle Royale):</strong> A escolha certa para Free Fire Mobile/Emulador com muitos times. O ranking é somado por quedas.
          </p>
        </div>
      ),
    },
    "scoring": {
      icon: <Lightbulb className="h-5 w-5 text-amber-400" />,
      title: "Sobre a Pontuação",
      content: (
        <p>
          O sistema calcula tudo sozinho! Você só precisa reportar a <strong className="text-white">Posição</strong> e os <strong className="text-white">Abates (Kills)</strong> de cada time após a partida. O ranking será atualizado instantaneamente para todos os jogadores.
        </p>
      ),
    },
    "fees": {
      icon: <Info className="h-5 w-5 text-blue-400" />,
      title: "Sobre as Taxas",
      content: (
        <p>
          A plataforma cobra uma taxa de <strong className="text-white">5%</strong> sobre as inscrições para manutenção dos servidores e processamento de pagamentos automáticos. O restante (95%) vai direto para sua premiação ou saldo.
        </p>
      ),
    },
    "apostados-flow": {
      icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
      title: "Como funciona o Apostado?",
      content: (
        <ul className="list-disc list-inside space-y-1">
          <li>Crie o evento com o valor desejado.</li>
          <li>Aguarde os jogadores se inscreverem.</li>
          <li>Quando lotar, passe o <strong className="text-white">ID e Senha</strong> no chat interno.</li>
          <li>Ao final, reporte quem ganhou e o sistema paga os vencedores.</li>
        </ul>
      ),
    },
    "results": {
      icon: <TrophyIcon className="h-5 w-5 text-primary" />,
      title: "Dica de Report",
      content: (
        <p>
          Evite erros! Confira o print do final da partida antes de salvar. Uma vez salvos, os pontos são distribuídos e o ranking é atualizado para todos em tempo real.
        </p>
      ),
    },
    "dashboard-welcome": {
      icon: <StarIcon className="h-6 w-6 text-purple-500" />,
      title: "Bem-vindo ao Painel de Organizador!",
      content: (
        <p className="text-sm">
          A Revallo facilita sua gestão. Aqui você cria seus eventos, monitora inscritos e gerencia premiações de forma 100% automatizada. <strong className="text-white">Dúvidas?</strong> Nossos guias contextuais em roxo estarão sempre por perto!
        </p>
      ),
    }
  };

  const guide = guides[type];

  return (
    <div className={cn(
      "p-4 rounded-2xl border border-white/5 bg-[#0D0D0F]/40 backdrop-blur-sm",
      className
    )}>
      <div className="flex gap-4">
        <div className="shrink-0 mt-0.5">
          {guide.icon}
        </div>
        <div>
          <h5 className="text-[11px] font-black uppercase tracking-widest text-primary italic mb-2">
            {guide.title}
          </h5>
          <div className="text-[10px] font-medium text-gray-400 leading-relaxed uppercase tracking-wide">
            {guide.content}
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal icons to avoid import issues for the demo
function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function StarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
