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
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

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
    console.log("MP Payment status:", mpPayment.status);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find our payment record
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
      console.log(`Confirming payment ${payment.id} for user ${payment.user_id}`);

      // Update payment status
      await supabase
        .from("pix_payments")
        .update({ status: "confirmed", paid_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Add credits to user
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", payment.user_id)
        .single();

      const newCredits = (profile?.credits || 0) + payment.credits_amount;
      
      await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", payment.user_id);

      // Create transaction record
      await supabase.from("credit_transactions").insert({
        user_id: payment.user_id,
        amount: payment.credits_amount,
        type: "purchase",
        description: `Compra de ${payment.credits_amount} créditos via PIX`,
        reference_id: payment.id,
      });

      console.log(`Credits added: ${payment.credits_amount} to user ${payment.user_id}`);
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
