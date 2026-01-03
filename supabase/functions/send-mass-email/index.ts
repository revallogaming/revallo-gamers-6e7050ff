import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No emails provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending mass email to ${emails.length} recipients for tournament: ${tournamentTitle}`);

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
            <h1>🎮 ${tournamentTitle}</h1>
            <p>Mensagem do Organizador</p>
          </div>
          <div class="content">
            <div class="badge">📢 Comunicado</div>
            <div class="message-box">
              ${message.replace(/\n/g, '<br>')}
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    // Send emails in batches of 50 to avoid rate limits
    const batchSize = 50;
    const results: any[] = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "Revallo <onboarding@resend.dev>",
          to: batch,
          subject: `🎮 ${tournamentTitle}: ${subject}`,
          html: emailHtml,
        });
        
        results.push({ batch: Math.floor(i / batchSize) + 1, success: true, response: emailResponse });
        console.log(`Batch ${Math.floor(i / batchSize) + 1} sent successfully`);
      } catch (batchError: any) {
        results.push({ batch: Math.floor(i / batchSize) + 1, success: false, error: batchError.message });
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError);
      }
      
      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
