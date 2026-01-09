import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit config: 10 emails per 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 5;

interface TournamentEmailRequest {
  type?: "registration" | "creation";
  email: string;
  tournamentTitle: string;
  tournamentLink?: string;
  startDate: string;
  entryFee?: number;
  game?: string;
  maxParticipants?: number;
  prizeDescription?: string;
  pixKey?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: allowed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'send-tournament-email',
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (allowed === false) {
      console.warn("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: TournamentEmailRequest = await req.json();
    const emailType = data.type || "creation";

    console.log(`Tournament email request type: ${emailType}, user: ${user.id}`);

    // Basic input validation
    if (!data.email || !data.tournamentTitle) {
      return new Response(
        JSON.stringify({ error: "Email e título do torneio são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "Não definido";
      const date = new Date(dateStr);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    let subject: string;
    let emailHtml: string;

    if (emailType === "registration") {
      // Registration confirmation email
      subject = `🎮 Inscrição confirmada: ${data.tournamentTitle}`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; color: #e5e5e5; }
            .info-box { background: #262626; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
            .label { font-weight: bold; color: #9ca3af; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; margin-top: 5px; color: #fff; }
            .highlight { color: #8b5cf6; font-weight: bold; }
            .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Inscrição Confirmada!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.tournamentTitle}</p>
            </div>
            <div class="content">
              <p>Olá! Sua inscrição no torneio foi realizada com sucesso.</p>
              
              <div class="info-box">
                <div class="label">Torneio</div>
                <div class="value">${data.tournamentTitle}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Data de Início</div>
                <div class="value">${formatDate(data.startDate)}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Valor da Inscrição</div>
                <div class="value">${data.entryFee && data.entryFee > 0 ? `R$ ${(data.entryFee / 100).toFixed(2).replace('.', ',')}` : 'Gratuita'}</div>
              </div>
              
              ${data.tournamentLink ? `
              <div class="info-box" style="background: #1e3a2f; border-left-color: #22c55e;">
                <div class="label">Link do Torneio</div>
                <div class="value"><a href="${data.tournamentLink}" style="color: #22c55e;">${data.tournamentLink}</a></div>
              </div>
              ` : ''}
              
              <p style="text-align: center;">
                <a href="https://revallo.com.br" class="button">Acessar Revallo</a>
              </p>
              
              <div class="footer">
                <p>Boa sorte no torneio! 🎮🏆</p>
                <p>© 2026 Revallo - Plataforma de Torneios eSports</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Tournament creation email (original behavior)
      subject = `✅ Torneio "${data.tournamentTitle}" criado com sucesso!`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; margin-top: 5px; }
            .highlight { color: #8b5cf6; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 Torneio Criado com Sucesso!</h1>
              <p>${data.tournamentTitle}</p>
            </div>
            <div class="content">
              <p>Parabéns! Seu torneio foi criado na plataforma Revallo.</p>
              
              ${data.game ? `
              <div class="info-box">
                <div class="label">Jogo</div>
                <div class="value">${data.game}</div>
              </div>
              ` : ''}
              
              <div class="info-box">
                <div class="label">Data de Início</div>
                <div class="value">${formatDate(data.startDate)}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Valor da Inscrição</div>
                <div class="value">${data.entryFee || 0} créditos</div>
              </div>
              
              ${data.maxParticipants ? `
              <div class="info-box">
                <div class="label">Máximo de Participantes</div>
                <div class="value">${data.maxParticipants} jogadores</div>
              </div>
              ` : ''}
              
              ${data.prizeDescription ? `
              <div class="info-box">
                <div class="label">Premiação</div>
                <div class="value">${data.prizeDescription}</div>
              </div>
              ` : ''}
              
              ${data.pixKey ? `
              <div class="info-box">
                <div class="label">Chave PIX para Recebimento</div>
                <div class="value highlight">${data.pixKey}</div>
              </div>
              
              <div class="info-box" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>💰 Taxa da Plataforma:</strong> 5% do valor de cada inscrição será retido. Você receberá 95% diretamente na sua chave PIX.</p>
              </div>
              ` : ''}
              
              <div class="footer">
                <p>© 2026 Revallo - Plataforma de Torneios eSports</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email via Resend
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Revallo <noreply@revallo.com.br>",
      to: [data.email],
      subject: subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email via Resend:", emailError);
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully via Resend:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailSent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-tournament-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
