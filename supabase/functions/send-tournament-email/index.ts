import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TournamentEmailRequest {
  tournamentId: string;
  email: string;
  tournamentTitle: string;
  game: string;
  startDate: string;
  entryFee: number;
  maxParticipants: number;
  prizeDescription: string;
  pixKey: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
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

    const data: TournamentEmailRequest = await req.json();

    // Validate email matches authenticated user (prevent email spoofing)
    if (data.email !== user.email) {
      console.error("Email mismatch: attempted to send to different email");
      return new Response(
        JSON.stringify({ error: "Email não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic input validation
    if (!data.tournamentTitle || data.tournamentTitle.length > 200) {
      return new Response(
        JSON.stringify({ error: "Título do torneio inválido" }),
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

    console.log("Tournament email request from authenticated user");

    // Email HTML template
    const emailHtml = `
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
            
            <div class="info-box">
              <div class="label">Jogo</div>
              <div class="value">${data.game}</div>
            </div>
            
            <div class="info-box">
              <div class="label">Data de Início</div>
              <div class="value">${formatDate(data.startDate)}</div>
            </div>
            
            <div class="info-box">
              <div class="label">Valor da Inscrição</div>
              <div class="value">${data.entryFee} créditos</div>
            </div>
            
            <div class="info-box">
              <div class="label">Máximo de Participantes</div>
              <div class="value">${data.maxParticipants} jogadores</div>
            </div>
            
            ${data.prizeDescription ? `
            <div class="info-box">
              <div class="label">Premiação</div>
              <div class="value">${data.prizeDescription}</div>
            </div>
            ` : ''}
            
            <div class="info-box">
              <div class="label">Chave PIX para Recebimento</div>
              <div class="value highlight">${data.pixKey}</div>
            </div>
            
            <div class="info-box" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;"><strong>💰 Taxa da Plataforma:</strong> 5% do valor de cada inscrição será retido. Você receberá 95% diretamente na sua chave PIX.</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Revallo - Plataforma de Torneios eSports</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const emailResponse = await resend.emails.send({
        from: "Revallo <onboarding@resend.dev>",
        to: [data.email],
        subject: `✅ Torneio "${data.tournamentTitle}" criado com sucesso!`,
        html: emailHtml,
      });

      console.log("Email sent successfully:", emailResponse);
      
      return new Response(JSON.stringify({ success: true, emailSent: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      console.log("RESEND_API_KEY not configured, email not sent");
      return new Response(JSON.stringify({ success: true, emailSent: false, message: "Email service not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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