import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JoinRequest {
  tournament_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { tournament_id }: JoinRequest = await req.json();

    console.log(`User ${user.id} joining tournament ${tournament_id}`);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('mini_tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Torneio não encontrado');
    }

    // Validate tournament status
    if (tournament.status !== 'open') {
      throw new Error('Torneio não está aberto para inscrições');
    }

    // Check if already registered
    const { data: existingParticipant } = await supabaseClient
      .from('mini_tournament_participants')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('player_id', user.id)
      .single();

    if (existingParticipant) {
      throw new Error('Você já está inscrito neste torneio');
    }

    // Check capacity
    if (tournament.current_participants >= tournament.max_participants) {
      throw new Error('Torneio está lotado');
    }

    // Check registration deadline
    if (new Date(tournament.registration_deadline) < new Date()) {
      throw new Error('Prazo de inscrição encerrado');
    }

    // Check if user has PIX key registered
    const { data: pixKey } = await supabaseClient
      .from('user_pix_keys')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!pixKey) {
      throw new Error('Você precisa cadastrar uma chave PIX antes de participar');
    }

    // Check and spend credits if entry fee exists
    if (tournament.entry_fee_credits > 0) {
      const { data: spendResult, error: spendError } = await supabaseClient
        .rpc('spend_credits', {
          p_user_id: user.id,
          p_amount: tournament.entry_fee_credits,
          p_type: 'mini_tournament_entry',
          p_description: `Entrada - ${tournament.title}`,
          p_reference_id: tournament_id,
        });

      if (spendError || !spendResult) {
        throw new Error('Créditos insuficientes para entrar no torneio');
      }
    }

    // Register participant
    const { data: participant, error: participantError } = await supabaseClient
      .from('mini_tournament_participants')
      .insert({
        tournament_id: tournament_id,
        player_id: user.id,
      })
      .select()
      .single();

    if (participantError) {
      // Refund credits if registration failed and entry fee was charged
      if (tournament.entry_fee_credits > 0) {
        await supabaseClient.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: tournament.entry_fee_credits,
        });
      }
      throw new Error('Erro ao registrar participação');
    }

    console.log(`Successfully registered participant ${participant.id}`);

    // Trigger email notification to organizer (fire and forget)
    try {
      const notifyUrl = `${supabaseUrl}/functions/v1/notify-mini-tournament-join`;
      fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament_id,
          player_id: user.id,
        }),
      }).catch(err => console.error('Failed to send notification:', err));
    } catch (notifyError) {
      console.error('Error triggering notification:', notifyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        participant_id: participant.id,
        message: 'Inscrição realizada com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error joining tournament:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
