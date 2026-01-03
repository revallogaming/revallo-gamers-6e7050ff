import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(
  signature: string,
  requestId: string,
  dataId: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(',');
  let ts = '';
  let hash = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') hash = value;
  }

  if (!ts || !hash) {
    console.error('Missing ts or hash in signature');
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(manifest);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedHash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hash === expectedHash;
}

async function sendRegistrationConfirmationEmail(
  email: string,
  tournamentTitle: string,
  tournamentLink: string | null
): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log("SMTP credentials not configured, skipping email");
    return;
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

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981; margin-bottom: 24px;">🎮 Inscrição Confirmada!</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Parabéns! Seu pagamento foi confirmado e você está oficialmente inscrito no torneio:
        </p>
        <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">${tournamentTitle}</h2>
        </div>
        ${tournamentLink ? `
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Acesse o link do torneio para mais informações:
          </p>
          <a href="${tournamentLink}" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
            Acessar Torneio
          </a>
        ` : ''}
        <p style="font-size: 14px; color: #666; margin-top: 32px; line-height: 1.6;">
          Fique atento às atualizações do organizador. Boa sorte! 🏆
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #9ca3af;">
          Este email foi enviado automaticamente pela plataforma Revallo Gamers.
        </p>
      </div>
    `;

    await client.send({
      from: smtpUser,
      to: email,
      subject: `✅ Inscrição Confirmada: ${tournamentTitle}`,
      content: "auto",
      html: htmlContent,
    });

    await client.close();
    console.log("Registration confirmation email sent successfully via SMTP to:", email);
  } catch (error) {
    console.error("Error sending confirmation email via SMTP:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (webhook verification)
  if (req.method === "GET") {
    console.log("Webhook verification request received");
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const text = await req.text();
    
    // Handle empty body
    if (!text || text.trim() === "") {
      console.log("Empty body received - likely a test request");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Body:", text);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log('Webhook notification received', { type: body.type, action: body.action });

    // MANDATORY signature verification for security
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');
    const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');

    // Signature verification is REQUIRED - reject if secret not configured
    if (!secret) {
      console.error('CRITICAL: MERCADOPAGO_WEBHOOK_SECRET not configured - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Webhook security not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature || !requestId) {
      console.error('Missing signature headers');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing signature headers' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dataId = body.data?.id ? String(body.data.id) : '';
    const isValid = await verifySignature(signature, requestId, dataId, secret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Signature verified successfully');

    // Only process payment notifications
    if (body.type !== "payment" || body.action !== "payment.updated") {
      console.log("Ignoring non-payment notification:", body.type, body.action);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error("No payment ID in webhook");
      return new Response(JSON.stringify({ error: "No payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payment details from Mercado Pago
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!mpResponse.ok) {
      console.error("Failed to get payment from MP:", await mpResponse.text());
      return new Response(JSON.stringify({ error: "MP API error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpPayment = await mpResponse.json();
    console.log('Payment status retrieved from provider');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this is a tournament registration payment (via metadata)
    const metadata = mpPayment.metadata;
    const isTournamentRegistration = metadata?.type === "tournament_registration";

    if (isTournamentRegistration) {
      // Handle tournament registration payment
      console.log('Processing tournament registration payment');
      
      const tournamentId = metadata.tournament_id;
      const userId = metadata.user_id;
      const participantEmail = metadata.participant_email;

      if (!tournamentId || !userId) {
        console.error("Missing tournament_id or user_id in metadata");
        return new Response(JSON.stringify({ error: "Invalid metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (mpPayment.status === "approved") {
        // Check if already registered (prevent duplicates)
        const { data: existingParticipant } = await supabase
          .from("tournament_participants")
          .select("id")
          .eq("tournament_id", tournamentId)
          .eq("player_id", userId)
          .single();

        if (existingParticipant) {
          console.log("User already registered in tournament, skipping");
          return new Response(JSON.stringify({ received: true, already_registered: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify tournament is still open and has space
        const { data: tournament, error: tournamentError } = await supabase
          .from("tournaments")
          .select("id, title, status, current_participants, max_participants, tournament_link")
          .eq("id", tournamentId)
          .single();

        if (tournamentError || !tournament) {
          console.error("Tournament not found:", tournamentError);
          return new Response(JSON.stringify({ error: "Tournament not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (tournament.status !== "open") {
          console.error("Tournament not open for registration");
          return new Response(JSON.stringify({ error: "Tournament closed" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (tournament.current_participants >= tournament.max_participants) {
          console.error("Tournament is full");
          return new Response(JSON.stringify({ error: "Tournament full" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Register participant
        const { error: insertError } = await supabase
          .from("tournament_participants")
          .insert({
            tournament_id: tournamentId,
            player_id: userId,
            participant_email: participantEmail,
          });

        if (insertError) {
          console.error("Error registering participant:", insertError);
          return new Response(JSON.stringify({ error: "Registration failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Successfully registered user ${userId} in tournament ${tournamentId}`);

        // Send confirmation email (non-blocking)
        if (participantEmail) {
          sendRegistrationConfirmationEmail(
            participantEmail,
            tournament.title,
            tournament.tournament_link
          ).catch(err => console.error("Email send error:", err));
        }
      } else if (mpPayment.status === "rejected" || mpPayment.status === "cancelled") {
        console.log("Tournament registration payment rejected/cancelled");
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle credit purchase payment (existing logic)
    const { data: payment, error: findError } = await supabase
      .from("pix_payments")
      .select("*")
      .eq("mercadopago_id", String(paymentId))
      .maybeSingle();

    if (findError || !payment) {
      console.error("Payment not found:", findError);
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process if payment is approved and not already confirmed
    if (mpPayment.status === "approved" && payment.status !== "confirmed") {
      console.log('Processing approved credit purchase payment');

      // Update payment status
      await supabase
        .from("pix_payments")
        .update({ status: "confirmed", paid_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Add credits using atomic function
      const { error: addCreditsError } = await supabase.rpc('add_credits', {
        p_user_id: payment.user_id,
        p_amount: payment.credits_amount
      });

      if (addCreditsError) {
        console.error("Error adding credits:", addCreditsError);
        throw addCreditsError;
      }

      // Create transaction record
      await supabase.from("credit_transactions").insert({
        user_id: payment.user_id,
        amount: payment.credits_amount,
        type: "purchase",
        description: `Compra de ${payment.credits_amount} créditos via PIX`,
        reference_id: payment.id,
      });

      console.log('Credit transaction completed successfully');
    } else if (mpPayment.status === "rejected" || mpPayment.status === "cancelled") {
      await supabase
        .from("pix_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
