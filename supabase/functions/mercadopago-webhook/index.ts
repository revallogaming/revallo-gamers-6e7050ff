import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform fee: 5%
const PLATFORM_FEE_PERCENT = 5;

async function transferToOrganizer(
  accessToken: string,
  organizerPixKey: string,
  amountBrl: number,
  tournamentTitle: string,
  paymentId: string
): Promise<{ success: boolean; error?: string; transferId?: string }> {
  // Calculate organizer amount (95%)
  const organizerAmount = Number((amountBrl * (100 - PLATFORM_FEE_PERCENT) / 100).toFixed(2));
  
  console.log(`Initiating PIX transfer: R$${organizerAmount} to ${organizerPixKey}`);
  console.log(`Payment ID reference: ${paymentId}, Tournament: ${tournamentTitle}`);
  
  // Note: Mercado Pago PIX transfers (disbursements) require a different API
  // and may require additional account verification (Conta Digital MP)
  // For now, we log the transfer request for manual processing or future API integration
  
  try {
    // Option 1: Use Mercado Pago's Point of Interaction for PIX transfers
    // This requires the account to have "Mercado Pago Conta Digital" enabled
    const response = await fetch("https://api.mercadopago.com/v1/transaction_intentions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": `transfer-${paymentId}-${Date.now()}`,
      },
      body: JSON.stringify({
        device: {},
        type: "pix",
        identification: {
          type: "pix_key",
          number: organizerPixKey,
        },
        payment: {
          type: "pix_transfer",
          amount: organizerAmount,
          destination: {
            type: "pix",
            key: organizerPixKey,
          },
        },
        description: `Repasse torneio: ${tournamentTitle.substring(0, 50)}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PIX transfer error response:", errorText);
      
      // Log transfer details for manual processing if API fails
      console.log("=== TRANSFER REQUEST FOR MANUAL PROCESSING ===");
      console.log(`Amount: R$${organizerAmount}`);
      console.log(`PIX Key: ${organizerPixKey}`);
      console.log(`Tournament: ${tournamentTitle}`);
      console.log(`Payment Reference: ${paymentId}`);
      console.log("===============================================");
      
      return { 
        success: false, 
        error: `Transfer API not available. Amount R$${organizerAmount} logged for manual transfer to ${organizerPixKey}` 
      };
    }

    const data = await response.json();
    console.log(`PIX transfer initiated: ${data.id}, status: ${data.status}`);
    
    return { success: true, transferId: String(data.id) };
  } catch (error) {
    console.error("PIX transfer exception:", error);
    
    // Log for manual processing
    console.log("=== TRANSFER REQUEST FOR MANUAL PROCESSING ===");
    console.log(`Amount: R$${organizerAmount}`);
    console.log(`PIX Key: ${organizerPixKey}`);
    console.log(`Tournament: ${tournamentTitle}`);
    console.log(`Payment Reference: ${paymentId}`);
    console.log("===============================================");
    
    return { 
      success: false, 
      error: `Exception occurred. Amount R$${organizerAmount} logged for manual transfer.` 
    };
  }
}

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
  participantEmail: string,
  organizerEmail: string | null,
  tournamentTitle: string,
  tournamentLink: string | null,
  playerNickname: string
): Promise<void> {
  const smtpUsername = Deno.env.get("SMTP_USERNAME");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpUsername || !smtpPassword) {
    console.log("SMTP credentials not configured, skipping email");
    return;
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    // Email para o jogador
    const playerHtml = `
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
          Este email foi enviado automaticamente pela plataforma Revallo.
        </p>
      </div>
    `;

    await client.send({
      from: smtpUsername,
      to: participantEmail,
      subject: `✅ Inscrição Confirmada: ${tournamentTitle}`,
      content: "auto",
      html: playerHtml,
    });
    console.log("Player confirmation email sent to:", participantEmail);

    // Email para o organizador (se disponível)
    if (organizerEmail) {
      const organizerHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1; margin-bottom: 24px;">🎯 Nova Inscrição no seu Torneio!</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Um novo jogador se inscreveu no seu torneio:
          </p>
          <div style="background: linear-gradient(135deg, #1f2937, #374151); border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">${tournamentTitle}</h2>
          </div>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #333;">
              <strong>Jogador:</strong> ${playerNickname}<br>
              <strong>Email:</strong> ${participantEmail}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 24px;">
            Acesse a plataforma Revallo para gerenciar os participantes.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="font-size: 12px; color: #9ca3af;">
            Este email foi enviado automaticamente pela plataforma Revallo.
          </p>
        </div>
      `;

      await client.send({
        from: smtpUsername,
        to: organizerEmail,
        subject: `🎯 Nova Inscrição: ${playerNickname} - ${tournamentTitle}`,
        content: "auto",
        html: organizerHtml,
      });
      console.log("Organizer notification email sent to:", organizerEmail);
    }

    await client.close();
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

        // Verify tournament is still accepting registrations
        const { data: tournament, error: tournamentError } = await supabase
          .from("tournaments")
          .select("id, title, status, current_participants, max_participants, tournament_link, organizer_id")
          .eq("id", tournamentId)
          .single();

        if (tournamentError || !tournament) {
          console.error("Tournament not found:", tournamentError);
          return new Response(JSON.stringify({ error: "Tournament not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Allow upcoming and open tournaments
        if (!["upcoming", "open"].includes(tournament.status)) {
          console.error("Tournament not accepting registrations:", tournament.status);
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

        // Get player nickname for organizer email
        const { data: playerProfile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", userId)
          .single();

        // Get organizer email from auth.users
        const { data: organizerAuth } = await supabase.auth.admin.getUserById(tournament.organizer_id);
        const organizerEmail = organizerAuth?.user?.email || null;

        // Get organizer PIX key for transfer
        const { data: organizerPaymentInfo } = await supabase
          .from("organizer_payment_info")
          .select("pix_key")
          .eq("organizer_id", tournament.organizer_id)
          .single();

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

        // Transfer 95% to organizer via PIX (non-blocking)
        const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        if (accessToken && organizerPaymentInfo?.pix_key) {
          const amountBrl = mpPayment.transaction_amount;
          transferToOrganizer(
            accessToken,
            organizerPaymentInfo.pix_key,
            amountBrl,
            tournament.title,
            String(paymentId)
          ).then(result => {
            if (result.success) {
              console.log(`PIX transfer successful: ${result.transferId}`);
            } else {
              console.error(`PIX transfer failed: ${result.error}`);
            }
          }).catch(err => console.error("PIX transfer error:", err));
        } else {
          console.warn("Organizer PIX key not configured, skipping transfer");
        }

        // Send confirmation email to player and organizer (non-blocking)
        if (participantEmail) {
          sendRegistrationConfirmationEmail(
            participantEmail,
            organizerEmail,
            tournament.title,
            tournament.tournament_link,
            playerProfile?.nickname || "Jogador"
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
