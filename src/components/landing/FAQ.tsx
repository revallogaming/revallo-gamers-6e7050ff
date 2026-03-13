"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Zap, Coins, ShieldCheck } from "lucide-react";

const FAQS = [
  {
    question: "Como funcionam os Apostados FF?",
    answer: "É simples: você escolhe um desafio (1v1, 2v2 ou 4v4), paga a taxa de entrada com seus créditos e entra na sala. O sistema gerencia toda a logística, e o vencedor recebe a premiação automaticamente na conta após a validação.",
    icon: <Zap className="text-primary" size={20} />,
  },
  {
    question: "Como adiciono créditos na minha conta?",
    answer: "Você pode adicionar créditos instantaneamente via PIX. Basta ir na sua carteira, escolher o valor e ler o QR Code. O saldo cai na hora para você começar a jogar.",
    icon: <Coins className="text-emerald-500" size={20} />,
  },
  {
    question: "Como recebo meus prêmios?",
    answer: "Suas vitórias se transformam em saldo sacável. Você pode solicitar o resgate via PIX a qualquer momento, e nossa equipe processa o pagamento com prioridade para garantir que o dinheiro chegue rápido na sua conta.",
    icon: <ShieldCheck className="text-blue-500" size={20} />,
  },
  {
    question: "A Revallo é segura?",
    answer: "Totalmente. Utilizamos tecnologia de ponta para garantir transações seguras, além de um sistema de moderação ativo para validar resultados e evitar fraudes, garantindo um ambiente justo para todos os jogadores.",
    icon: <ShieldCheck className="text-purple-500" size={20} />,
  },
];

function FAQItem({ faq, index }: { faq: typeof FAQS[0], index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-white/5 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
            {faq.icon}
          </div>
          <span className="text-white font-black italic uppercase tracking-tight text-lg md:text-xl group-hover:text-primary transition-colors">
            {faq.question}
          </span>
        </div>
        <ChevronDown 
          size={24} 
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-8 pl-14 pr-4">
              <p className="text-gray-400 font-medium leading-relaxed italic text-base md:text-lg">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section className="py-24 bg-[#020106] relative overflow-hidden" id="faq">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-md"
          >
            <HelpCircle size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Central de Ajuda
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6"
          >
            FICOU ALGUMA <br />
            <span className="text-primary italic">DÚVIDA?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-bold uppercase tracking-widest text-sm"
          >
            Tudo o que você precisa saber para começar a dominar o cenário.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto bg-[#0F0F18]/50 rounded-[48px] border border-white/5 p-8 md:p-12 backdrop-blur-xl">
          {FAQS.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 transition-opacity duration-1000" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full translate-x-1/2 transition-opacity duration-1000" />
    </section>
  );
}
