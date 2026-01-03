import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit config: 5 payments per 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      p_endpoint: 'create-tournament-registration-pix',
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

    const { tournament_id, email, amount_brl } = await req.json();

    // Input validation
    if (!tournament_id || typeof tournament_id !== 'string') {
      return new Response(
        JSON.stringify({ error: "ID do torneio é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount_brl || typeof amount_brl !== 'number' || amount_brl <= 0) {
      return new Response(
        JSON.stringify({ error: "Valor inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify tournament exists and has the correct entry fee
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from("tournaments")
      .select("id, title, entry_fee, status, current_participants, max_participants")
      .eq("id", tournament_id)
      .single();

    if (tournamentError || !tournament) {
      console.error("Tournament not found:", tournamentError);
      return new Response(
        JSON.stringify({ error: "Torneio não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tournament status (allow upcoming and open)
    if (!["upcoming", "open"].includes(tournament.status)) {
      return new Response(
        JSON.stringify({ error: "Inscrições encerradas para este torneio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if tournament is full
    if (tournament.current_participants >= tournament.max_participants) {
      return new Response(
        JSON.stringify({ error: "Torneio lotado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount matches tournament entry fee (stored in centavos)
    const expectedAmountBRL = tournament.entry_fee / 100;
    if (Math.abs(amount_brl - expectedAmountBRL) > 0.01) {
      console.error(`Amount mismatch: expected ${expectedAmountBRL}, got ${amount_brl}`);
      return new Response(
        JSON.stringify({ error: "Valor da inscrição incorreto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already registered
    const { data: existingParticipant } = await supabaseAdmin
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournament_id)
      .eq("player_id", user.id)
      .single();

    if (existingParticipant) {
      return new Response(
        JSON.stringify({ error: "Você já está inscrito neste torneio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating PIX payment for tournament registration: ${tournament.title}`);

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Pagamento não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize tournament title for description
    const sanitizedTitle = tournament.title.substring(0, 100).replace(/[<>]/g, '');

    // Create PIX payment in Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount_brl),
        description: `Inscrição: ${sanitizedTitle}`,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
        metadata: {
          type: "tournament_registration",
          tournament_id: tournament_id,
          user_id: user.id,
          participant_email: email,
        },
      }),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("Mercado Pago error:", mpError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar pagamento PIX" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpData = await mpResponse.json();
    console.log('Mercado Pago payment created for tournament registration');

    // We could save a pending registration record here if needed
    // For now, we just return the PIX data and rely on webhook for confirmation

    return new Response(
      JSON.stringify({
        payment_id: String(mpData.id),
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        tournament_id: tournament_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});