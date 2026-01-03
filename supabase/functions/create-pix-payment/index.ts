import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Define valid credit packages - must match frontend CREDIT_PACKAGES
    const VALID_PACKAGES = [
      { brl: 10, credits: 100 },
      { brl: 25, credits: 275 },
      { brl: 50, credits: 600 },
      { brl: 100, credits: 1300 }
    ] as const;

    const { amount_brl, credits_amount } = await req.json();
    
    // Validate against valid packages only
    const validPackage = VALID_PACKAGES.find(
      pkg => pkg.brl === amount_brl && pkg.credits === credits_amount
    );

    if (!validPackage) {
      console.error(`Invalid package: ${amount_brl} BRL = ${credits_amount} credits`);
      return new Response(
        JSON.stringify({ 
          error: "Pacote de créditos inválido",
          valid_packages: VALID_PACKAGES 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating PIX payment for user ${user.id}: R$${amount_brl} = ${credits_amount} créditos`);

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Pagamento não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        description: `${credits_amount} Créditos Revallo`,
        payment_method_id: "pix",
        payer: {
          email: user.email,
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
    console.log("Mercado Pago payment created:", mpData.id);

    // Save payment record using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: payment, error: insertError } = await supabaseAdmin
      .from("pix_payments")
      .insert({
        user_id: user.id,
        amount_brl,
        credits_amount,
        mercadopago_id: String(mpData.id),
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar pagamento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Payment saved:", payment.id);

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        qr_code: payment.qr_code,
        qr_code_base64: payment.qr_code_base64,
        mercadopago_id: payment.mercadopago_id,
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
