import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositRequest {
  tournament_id: string;
  amount_brl: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mercadopagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { tournament_id, amount_brl }: DepositRequest = await req.json();

    console.log(`Creating prize deposit for tournament ${tournament_id}, amount: R$${amount_brl}`);

    // Verify tournament exists and user is the organizer
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('mini_tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Torneio não encontrado');
    }

    if (tournament.organizer_id !== user.id) {
      throw new Error('Apenas o organizador pode depositar a premiação');
    }

    if (tournament.deposit_confirmed) {
      throw new Error('Depósito de premiação já foi confirmado');
    }

    // Validate amount matches prize pool
    if (Number(amount_brl) !== Number(tournament.prize_pool_brl)) {
      throw new Error(`Valor deve ser igual ao prêmio definido: R$${tournament.prize_pool_brl}`);
    }

    // Get organizer profile for email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();

    // Get user email
    const { data: authUser } = await supabaseClient.auth.admin.getUserById(user.id);
    const userEmail = authUser?.user?.email || 'organizador@revallo.com';

    // Create Mercado Pago PIX payment
    const paymentPayload = {
      transaction_amount: Number(amount_brl),
      description: `Depósito de premiação - ${tournament.title}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: profile?.nickname || 'Organizador',
      },
      metadata: {
        type: 'prize_deposit',
        tournament_id: tournament_id,
        organizer_id: user.id,
      },
    };

    console.log('Creating Mercado Pago payment:', JSON.stringify(paymentPayload));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercadopagoToken}`,
        'X-Idempotency-Key': `prize-deposit-${tournament_id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', JSON.stringify(mpData));
      throw new Error(mpData.message || 'Erro ao criar pagamento PIX');
    }

    console.log('Mercado Pago payment created:', mpData.id);

    // Store deposit record
    const { data: deposit, error: depositError } = await supabaseClient
      .from('prize_deposits')
      .insert({
        tournament_id: tournament_id,
        organizer_id: user.id,
        amount_brl: amount_brl,
        mercadopago_id: mpData.id.toString(),
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        status: 'pending',
      })
      .select()
      .single();

    if (depositError) {
      console.error('Error saving deposit:', depositError);
      throw new Error('Erro ao salvar depósito');
    }

    // Update tournament status
    await supabaseClient
      .from('mini_tournaments')
      .update({ 
        status: 'pending_deposit',
        deposit_payment_id: deposit.id 
      })
      .eq('id', tournament_id);

    return new Response(
      JSON.stringify({
        success: true,
        deposit_id: deposit.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        mercadopago_id: mpData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error creating prize deposit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
