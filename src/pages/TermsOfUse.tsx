import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso – Revallo</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 03/01/2026</p>

          <p className="text-foreground/90 mb-6">
            Bem-vindo à Revallo. Estes Termos de Uso regulam o acesso e a utilização da plataforma Revallo, 
            voltada à organização, divulgação e participação em torneios de eSports, incluindo sistemas de 
            anúncios e créditos pagos via Pix.
          </p>
          <p className="text-foreground/90 mb-8">
            Ao acessar ou utilizar a Revallo, você concorda integralmente com estes Termos. 
            Caso não concorde, não utilize a plataforma.
          </p>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Definições</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Revallo:</strong> Plataforma web destinada à criação, gestão e participação em torneios de eSports.</li>
              <li><strong>Usuário:</strong> Qualquer pessoa física ou jurídica que acesse ou utilize a plataforma.</li>
              <li><strong>Organizador:</strong> Usuário responsável por criar e administrar torneios.</li>
              <li><strong>Participante:</strong> Usuário que se inscreve em torneios.</li>
              <li><strong>Créditos:</strong> Saldo virtual adquirido mediante pagamento em reais (BRL), utilizado para anúncios e funcionalidades da plataforma.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Elegibilidade</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>2.1. Para utilizar a Revallo, o usuário deve ter idade mínima de 13 anos.</li>
              <li>2.2. Usuários menores de 18 anos declaram possuir autorização de seus responsáveis legais.</li>
              <li>2.3. A Revallo pode solicitar informações adicionais para verificação de identidade e idade.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>3.1. O usuário é responsável por fornecer informações verdadeiras, completas e atualizadas.</li>
              <li>3.2. Cada usuário é responsável pela segurança de sua conta, login e senha.</li>
              <li>3.3. A Revallo não se responsabiliza por acessos não autorizados decorrentes de negligência do usuário.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Funcionalidades da Plataforma</h2>
            <p className="text-foreground/80 mb-4">A Revallo oferece, entre outras funcionalidades:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
              <li>Criação e gerenciamento de torneios de eSports;</li>
              <li>Inscrição de participantes em torneios;</li>
              <li>Sistema de anúncios por meio de créditos;</li>
              <li>Divulgação de campeonatos e eventos competitivos.</li>
            </ul>
            <p className="text-foreground/80">
              A Revallo se reserva o direito de alterar, suspender ou encerrar funcionalidades a qualquer momento.
            </p>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Pagamentos, Créditos e Pix</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>5.1. A plataforma utiliza Pix como meio exclusivo de pagamento.</li>
              <li>5.2. Os valores pagos são convertidos em créditos Revallo, que não possuem valor monetário fora da plataforma.</li>
              <li>5.3. Os créditos não são reembolsáveis, salvo em casos previstos em lei.</li>
              <li>5.4. A Revallo não se responsabiliza por erros de pagamento causados por informações incorretas fornecidas pelo usuário.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Responsabilidades dos Usuários</h2>
            <p className="text-foreground/80 mb-4">O usuário compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Utilizar a plataforma de forma lícita e ética;</li>
              <li>Não praticar fraudes, manipulação de resultados ou condutas antidesportivas;</li>
              <li>Não publicar conteúdos ofensivos, ilegais ou que violem direitos de terceiros;</li>
              <li>Respeitar as regras específicas de cada torneio.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Torneios e Premiações</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>7.1. A Revallo atua como intermediadora tecnológica, não sendo responsável pela organização prática dos torneios, salvo quando expressamente indicado.</li>
              <li>7.2. A responsabilidade por regras, prêmios e pagamentos de premiações é do organizador do torneio.</li>
              <li>7.3. A Revallo não garante o cumprimento das obrigações dos organizadores ou participantes.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Propriedade Intelectual</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>8.1. Todo o conteúdo da Revallo (marca, logotipo, layout, código, textos e funcionalidades) é protegido por direitos de propriedade intelectual.</li>
              <li>8.2. É proibida a reprodução, cópia ou exploração sem autorização expressa.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Suspensão e Encerramento de Conta</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>9.1. A Revallo pode suspender ou encerrar contas que violem estes Termos, sem aviso prévio.</li>
              <li>9.2. Em caso de encerramento, créditos não utilizados poderão ser perdidos, conforme a legislação aplicável.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Limitação de Responsabilidade</h2>
            <p className="text-foreground/80 mb-4">10.1. A Revallo não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Falhas técnicas, indisponibilidade ou erros de sistema;</li>
              <li>Prejuízos decorrentes de decisões tomadas com base nas informações da plataforma;</li>
              <li>Condutas de usuários, organizadores ou terceiros.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Privacidade e Dados</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>11.1. O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).</li>
              <li>11.2. Informações detalhadas estão disponíveis na Política de Privacidade da Revallo.</li>
            </ul>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Alterações dos Termos</h2>
            <p className="text-foreground/80">
              A Revallo pode modificar estes Termos a qualquer momento. O uso contínuo da plataforma após as 
              alterações implica concordância com a versão atualizada.
            </p>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Lei Aplicável e Foro</h2>
            <p className="text-foreground/80 mb-2">
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p className="text-foreground/80">
              Fica eleito o foro do domicílio do usuário, conforme legislação aplicável, para dirimir eventuais controvérsias.
            </p>
          </section>

          <hr className="border-border my-8" />

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contato</h2>
            <p className="text-foreground/80">
              Em caso de dúvidas, entre em contato com a equipe da Revallo por meio dos canais oficiais da plataforma.
            </p>
          </section>

          <hr className="border-border my-8" />

          <p className="text-center text-primary font-semibold text-lg mt-8">
            Revallo – Conectando competidores, torneios e oportunidades no eSports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
