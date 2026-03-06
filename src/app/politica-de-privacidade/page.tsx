"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Database, Eye, Lock, Trash2 } from "lucide-react";

export default function PoliticaPrivacidade() {
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
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                Política de Privacidade
              </h1>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                Revallo Technologies • Versão 1.0 • Março 2026
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-sm text-gray-400">
            Esta política explica como coletamos, usamos e protegemos suas
            informações pessoais.
          </div>
        </div>

        <div className="space-y-12 text-gray-300">
          {/* 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-black italic uppercase">
                1. Dados que Coletamos
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>Para operar o serviço, coletamos os seguintes dados:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Dados de cadastro:</strong> email, nickname e avatar
                  escolhido
                </li>
                <li>
                  <strong>Dados de perfil:</strong> informações opcionais
                  adicionadas pelo usuário
                </li>
                <li>
                  <strong>Dados de pagamento:</strong> processados pelo Mercado
                  Pago — não armazenamos dados de cartão
                </li>
                <li>
                  <strong>Dados de atividade:</strong> torneios participados,
                  resultados e interações na plataforma
                </li>
                <li>
                  <strong>Dados técnicos:</strong> endereço IP, tipo de
                  navegador e dispositivo (para segurança)
                </li>
              </ul>
            </div>
          </section>

          {/* 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-black italic uppercase">
                2. Como Usamos seus Dados
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>Utilizamos seus dados exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Criar e gerenciar sua conta na plataforma</li>
                <li>Processar inscrições e premiações em torneios</li>
                <li>
                  Enviar notificações relevantes sobre sua conta e torneios
                </li>
                <li>
                  Detectar e prevenir fraudes, abusos e violações dos Termos
                </li>
                <li>Melhorar a experiência e os serviços da plataforma</li>
                <li>Cumprir obrigações legais quando exigido</li>
              </ul>
              <p className="mt-3">
                <strong>Nunca vendemos seus dados</strong> a terceiros para fins
                publicitários.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-black italic uppercase">
                3. Segurança dos Dados
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                A Revallo utiliza infraestrutura de nível enterprise
                (Firebase/Google Cloud) com criptografia em trânsito (TLS) e em
                repouso para proteger suas informações.
              </p>
              <p>
                Senhas são armazenadas com hash seguro e nunca em texto puro.
                Não temos acesso à sua senha.
              </p>
              <p>
                O acesso a dados privilegiados é restrito a membros da equipe
                com necessidade operacional e é auditado.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-black italic uppercase">
                4. Seus Direitos (LGPD)
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                Em conformidade com a Lei Geral de Proteção de Dados (Lei
                13.709/2018), você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Acessar</strong> os dados que temos sobre você
                </li>
                <li>
                  <strong>Corrigir</strong> dados incorretos ou incompletos
                </li>
                <li>
                  <strong>Excluir</strong> sua conta e dados (exceto quando há
                  obrigação legal de retenção)
                </li>
                <li>
                  <strong>Portabilidade</strong> dos seus dados em formato
                  estruturado
                </li>
                <li>
                  <strong>Revogar</strong> consentimento para uso de dados a
                  qualquer momento
                </li>
              </ul>
              <p className="mt-3">
                Para exercer seus direitos, entre em contato:{" "}
                <span className="text-purple-400">
                  privacidade@revallo.com.br
                </span>
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-black italic uppercase">
                5. Cookies e Rastreamento
              </h2>
            </div>
            <div className="space-y-3 pl-8 text-sm leading-relaxed">
              <p>
                Usamos cookies essenciais para manter sua sessão ativa e
                garantir o funcionamento da plataforma. Não usamos cookies de
                rastreamento de terceiros para anúncios.
              </p>
              <p>
                Ao navegar na plataforma, você concorda com o uso de cookies
                essenciais.
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
              href="/termos-de-uso"
              className="text-xs text-gray-500 hover:text-primary transition-colors font-bold"
            >
              Termos de Uso
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
