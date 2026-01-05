import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmailViaSMTP(
  to: string,
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

    await client.send({
      from: smtpUser,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    });

    await client.close();
    console.log("Email sent successfully via SMTP to:", to);
    return true;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("Starting admin-reset-password function");
    console.log("SUPABASE_URL available:", !!supabaseUrl);
    console.log("SERVICE_ROLE_KEY available:", !!serviceRoleKey);
    console.log("ANON_KEY available:", !!anonKey);

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify they're an admin
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Não autorizado - usuário inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Check if the caller is an admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    console.log("Is admin check:", isAdmin, "Error:", roleError);

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem alterar senhas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { userId, newPassword, sendEmail } = body;

    console.log("Request body - userId:", userId, "sendEmail:", sendEmail);

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "userId e newPassword são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.id} is resetting password for user ${userId}`);

    // Get target user info for email
    const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (targetUserError) {
      console.error("Error getting target user:", targetUserError);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for nickname
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("nickname")
      .eq("id", userId)
      .single();

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Password reset successful for user ${userId}`);

    // Send email with new password if requested
    let emailSent = false;
    if (sendEmail && targetUser?.user?.email) {
      const nickname = profile?.nickname || "Usuário";
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
            .password-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #8b5cf6; letter-spacing: 2px; font-family: monospace; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Sua Senha Foi Alterada</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${nickname}</strong>,</p>
              <p>Sua senha na plataforma Revallo foi alterada por um administrador.</p>
              
              <div class="password-box">
                <p style="margin: 0 0 10px 0; color: #6b7280;">Sua nova senha:</p>
                <div class="password">${newPassword}</div>
              </div>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, recomendamos que você altere esta senha ao fazer login.</p>
              </div>
              
              <p>Se você não solicitou esta alteração, entre em contato com nosso suporte imediatamente.</p>
              
              <div class="footer">
                <p>© 2026 Revallo - Plataforma de Torneios eSports</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      emailSent = await sendEmailViaSMTP(
        targetUser.user.email,
        "🔐 Sua senha foi alterada - Revallo",
        emailHtml
      );

      console.log("Email sent:", emailSent);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha alterada com sucesso",
        emailSent 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor: " + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
