import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit config: 3 mass emails per 30 minutes (strict for mass email)
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 30;

interface MassEmailRequest {
  emails: string[];
  subject: string;
  message: string;
  tournamentTitle: string;
}

async function sendEmailViaSMTP(
  to: string | string[],
  subject: string,
  html: string
): Promise<boolean> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log("SMTP credentials not configured");
    return false;
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    // Send to each recipient individually to avoid exposing email addresses
    const recipients = Array.isArray(to) ? to : [to];
    for (const recipient of recipients) {
      await client.send({
        from: smtpUser,
        to: recipient,
        subject: subject,
        content: "auto",
        html: html,
      });
    }

    await client.close();
    console.log(`Email sent successfully via SMTP to ${recipients.length} recipients`);
    return true;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
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
      p_endpoint: 'send-mass-email',
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

    const data: MassEmailRequest = await req.json();
    const { emails, subject, message, tournamentTitle } = data;

    // Input validation for emails
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No emails provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email count limit
    if (emails.length > 500) {
      return new Response(
        JSON.stringify({ error: "Limite máximo de 500 destinatários por envio" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input validation for subject
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Assunto é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Assunto deve ter no máximo 200 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input validation for message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Mensagem deve ter no máximo 5000 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input validation for tournamentTitle
    if (!tournamentTitle || typeof tournamentTitle !== 'string' || tournamentTitle.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Título do torneio é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (tournamentTitle.length > 150) {
      return new Response(
        JSON.stringify({ error: "Título do torneio deve ter no máximo 150 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs - escape HTML to prevent injection
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const sanitizedSubject = escapeHtml(subject.trim());
    const sanitizedMessage = escapeHtml(message.trim());
    const sanitizedTournamentTitle = escapeHtml(tournamentTitle.trim());

    console.log(`Sending mass email to ${emails.length} recipients for tournament: ${sanitizedTournamentTitle}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: pre-wrap; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          .badge { display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 ${sanitizedTournamentTitle}</h1>
            <p>Mensagem do Organizador</p>
          </div>
          <div class="content">
            <div class="badge">📢 Comunicado</div>
            <div class="message-box">
              ${sanitizedMessage.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>Este email foi enviado através da plataforma Revallo.</p>
              <p>© 2026 Revallo - Plataforma de Torneios eSports</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches
    const batchSize = 50;
    const results: { batch: number; success: boolean; count: number }[] = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      try {
        const success = await sendEmailViaSMTP(
          batch,
          `🎮 ${sanitizedTournamentTitle}: ${sanitizedSubject}`,
          emailHtml
        );
        
        results.push({ batch: batchNum, success, count: batch.length });
        console.log(`Batch ${batchNum} sent: ${success ? 'success' : 'failed'}`);
      } catch (batchError: any) {
        results.push({ batch: batchNum, success: false, count: batch.length });
        console.error(`Batch ${batchNum} failed:`, batchError);
      }
      
      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successfulBatches = results.filter(r => r.success).length;
    const totalBatches = results.length;

    console.log(`Mass email completed: ${successfulBatches}/${totalBatches} batches successful`);

    return new Response(
      JSON.stringify({ 
        success: successfulBatches > 0, 
        totalEmails: emails.length,
        successfulBatches,
        totalBatches,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-mass-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
