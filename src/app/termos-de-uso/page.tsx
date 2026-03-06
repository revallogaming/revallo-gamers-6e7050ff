"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  FileText,
  AlertTriangle,
  Users,
  CreditCard,
  Scale,
} from "lucide-react";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-bold mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a Revallo
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                Termos de Uso
              </h1>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                Revallo Technologies • Versão 1.0 • Março 2026
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-gray-400">
            Ao criar uma conta ou usar a plataforma Revallo, você concorda com
            os termos abaixo. Leia com atenção.
          </div>
        </div>

        <div className="space-y-12 text-gray-300">
          {/* 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black italic uppercase">
                1. Elegibilidade e Cadastro
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                Para utilizar a Revallo, o usuário deve ter{" "}
                <strong>18 anos ou mais</strong>, ou possuir autorização formal
                do seu responsável legal.
              </p>
              <p>
                Ao se cadastrar, o usuário se responsabiliza por fornecer
                informações verdadeiras, precisas e atualizadas. A Revallo se
                reserva o direito de encerrar contas com dados falsos ou
                suspeitos.
              </p>
              <p>
                Cada usuário pode possuir apenas{" "}
                <strong>uma conta ativa</strong>. Contas múltiplas podem
                resultar em banimento permanente.
              </p>
              <p>
                Nicknames não podem conter linguagem ofensiva, discriminatória,
                sexual, racista ou qualquer forma de discurso de ódio. A Revallo
                usa filtros automáticos e moderação humana para aplicar essa
                regra.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black italic uppercase">
                2. Conduta e Fair Play
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                A Revallo é uma plataforma de competições gamers que valoriza o{" "}
                <strong>
                  fair play, o respeito mútuo e a integridade competitiva
                </strong>
                .
              </p>
              <p>É expressamente proibido:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  Uso de cheats, hacks, scripts ou qualquer tipo de trapaça
                </li>
                <li>
                  Manipulação de resultados ou acordos ilícitos entre
                  participantes
                </li>
                <li>
                  Assédio, ameaças, discurso de ódio ou discriminação de
                  qualquer natureza
                </li>
                <li>
                  Compartilhamento de conteúdo ilegal, pornográfico ou que viole
                  direitos de terceiros
                </li>
                <li>
                  Tentativas de invasão, exploração de bugs ou qualquer ataque à
                  infraestrutura
                </li>
              </ul>
              <p className="mt-3">
                Violações podem resultar em advertência, suspensão temporária ou
                banimento permanente, a critério da Revallo.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black italic uppercase">
                3. Torneios, Prêmios e Pagamentos
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                As inscrições em torneios pagos envolvem transações financeiras
                por meio de <strong>Pix</strong>, processadas pela plataforma
                Mercado Pago em ambiente seguro.
              </p>
              <p>
                Os prêmios em dinheiro são creditados via Pix ao vencedor em até{" "}
                <strong>72 horas úteis</strong> após a confirmação dos
                resultados pela moderação.
              </p>
              <p>
                A Revallo retém uma taxa de serviço conforme descrito em cada
                torneio. Esta taxa é apresentada antes da inscrição.
              </p>
              <p>
                Resultados contestados devem ser reportados com comprovação
                (print/vídeo) em até 24 horas após o encerramento do torneio. A
                decisão da equipe de moderação é final.
              </p>
              <p>
                Reembolsos só são realizados em casos de cancelamento do torneio
                pela Revallo antes do início.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black italic uppercase">
                4. Privacidade e Dados
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                A Revallo coleta apenas os dados necessários para o
                funcionamento da plataforma, conforme descrito na nossa{" "}
                <Link
                  href="/politica-de-privacidade"
                  className="text-primary hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
              <p>
                Seus dados não são vendidos a terceiros. Podemos compartilhá-los
                apenas quando exigido por lei ou para processamento de
                pagamentos.
              </p>
              <p>
                O usuário pode solicitar a exclusão de sua conta e dados a
                qualquer momento entrando em contato com o suporte.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black italic uppercase">
                5. Disposições Gerais
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                A Revallo pode modificar estes Termos a qualquer momento.
                Usuários serão notificados por email em alterações substanciais.
                O uso continuado da plataforma após mudanças implica aceitação.
              </p>
              <p>
                Estes Termos são regidos pelas leis brasileiras. Quaisquer
                disputas serão resolvidas no foro da{" "}
                <strong>Comarca de São Paulo/SP</strong>.
              </p>
              <p>
                Para dúvidas:{" "}
                <span className="text-primary">suporte@revallo.com.br</span>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
            © 2026 Revallo Technologies. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link
              href="/politica-de-privacidade"
              className="text-xs text-gray-500 hover:text-primary transition-colors font-bold"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/auth"
              className="text-xs text-gray-500 hover:text-primary transition-colors font-bold"
            >
              Criar Conta
            </Link>
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-primary transition-colors font-bold"
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
