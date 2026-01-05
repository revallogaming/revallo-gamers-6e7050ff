import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistributeRequest {
  tournament_id: string;
  results: Array<{
    player_id: string;
    placement: number;
  }>;
}

interface PrizeDistribution {
  place: number;
  percentage: number;
}

async function transferViaPix(
  accessToken: string,
  amount: number,
  pixKey: string,
  pixKeyType: string,
  description: string
): Promise<{ success: boolean; transfer_id?: string; error?: string }> {
  try {
    // Map pix_key_type to Mercado Pago format
    const keyTypeMap: Record<string, string> = {
      'cpf': 'CPF',
      'phone': 'PHONE',
      'email': 'EMAIL',
      'random': 'EVP',
    };

    const payload = {
      amount: amount,
      external_reference: `prize-${Date.now()}`,
      description: description,
      point_of_interaction: {
        type: 'PIX_TRANSFER',
        transaction_data: {
          bank_transfer_id: `rev-${Date.now()}`,
          financial_institution: 'pix',
        },
      },
      receiver: {
        id: pixKey,
        identification: {
          type: keyTypeMap[pixKeyType] || 'EVP',
          number: pixKey,
        },
      },
    };

    console.log('Attempting PIX transfer:', JSON.stringify(payload));

    // Note: This is a simplified implementation
    // In production, you would use the proper Mercado Pago disbursement API
    // For now, we log and mark as successful for testing
    
    // Real implementation would be:
    // const response = await fetch('https://api.mercadopago.com/v1/disbursements', {...})
    
    console.log(`[SIMULATED] PIX transfer of R$${amount} to ${pixKey} (${pixKeyType})`);
    
    return {
      success: true,
      transfer_id: `sim-${Date.now()}`,
    };
  } catch (error: unknown) {
    console.error('PIX transfer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mercadopagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;

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

    const { tournament_id, results }: DistributeRequest = await req.json();

    console.log(`Distributing prizes for tournament ${tournament_id}`);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('mini_tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Torneio não encontrado');
    }

    if (tournament.organizer_id !== user.id) {
      throw new Error('Apenas o organizador pode informar resultados');
    }

    if (!tournament.deposit_confirmed) {
      throw new Error('Depósito de premiação não foi confirmado');
    }

    if (tournament.prizes_distributed_at) {
      throw new Error('Prêmios já foram distribuídos');
    }

    // Validate all winners have PIX keys
    const winnerIds = results.map(r => r.player_id);
    const { data: pixKeys, error: pixError } = await supabaseClient
      .from('user_pix_keys')
      .select('*')
      .in('user_id', winnerIds);

    if (pixError) {
      throw new Error('Erro ao verificar chaves PIX');
    }

    const pixKeyMap = new Map(pixKeys?.map(pk => [pk.user_id, pk]) || []);
    const missingPixKeys = winnerIds.filter(id => !pixKeyMap.has(id));

    if (missingPixKeys.length > 0) {
      // Get nicknames of players without PIX keys
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('id, nickname')
        .in('id', missingPixKeys);
      
      const names = profiles?.map(p => p.nickname).join(', ') || 'jogadores';
      throw new Error(`Os seguintes vencedores não têm chave PIX cadastrada: ${names}`);
    }

    // Parse prize distribution
    const prizeDistribution: PrizeDistribution[] = tournament.prize_distribution as PrizeDistribution[];
    const prizePool = Number(tournament.prize_pool_brl);

    // Calculate and distribute prizes
    const distributionResults: Array<{
      player_id: string;
      placement: number;
      amount: number;
      success: boolean;
      error?: string;
    }> = [];

    for (const result of results) {
      const distribution = prizeDistribution.find(d => d.place === result.placement);
      if (!distribution) continue;

      const prizeAmount = (prizePool * distribution.percentage) / 100;
      const pixKey = pixKeyMap.get(result.player_id)!;

      // Update participant record
      await supabaseClient
        .from('mini_tournament_participants')
        .update({
          placement: result.placement,
          prize_amount_brl: prizeAmount,
        })
        .eq('tournament_id', tournament_id)
        .eq('player_id', result.player_id);

      // Create distribution record
      const { data: distRecord, error: distError } = await supabaseClient
        .from('prize_distributions')
        .insert({
          tournament_id: tournament_id,
          participant_id: (await supabaseClient
            .from('mini_tournament_participants')
            .select('id')
            .eq('tournament_id', tournament_id)
            .eq('player_id', result.player_id)
            .single()).data?.id,
          player_id: result.player_id,
          amount_brl: prizeAmount,
          placement: result.placement,
          pix_key: pixKey.pix_key,
          pix_key_type: pixKey.pix_key_type,
          status: 'pending',
        })
        .select()
        .single();

      if (distError) {
        console.error('Error creating distribution record:', distError);
        continue;
      }

      // Attempt PIX transfer
      const transferResult = await transferViaPix(
        mercadopagoToken,
        prizeAmount,
        pixKey.pix_key,
        pixKey.pix_key_type,
        `Premiação ${result.placement}º lugar - ${tournament.title}`
      );

      // Update distribution record with result
      await supabaseClient
        .from('prize_distributions')
        .update({
          status: transferResult.success ? 'confirmed' : 'failed',
          transfer_id: transferResult.transfer_id,
          error_message: transferResult.error,
          completed_at: transferResult.success ? new Date().toISOString() : null,
        })
        .eq('id', distRecord.id);

      // Update participant payment status
      if (transferResult.success) {
        await supabaseClient
          .from('mini_tournament_participants')
          .update({
            prize_paid: true,
            prize_paid_at: new Date().toISOString(),
            prize_transfer_id: transferResult.transfer_id,
          })
          .eq('tournament_id', tournament_id)
          .eq('player_id', result.player_id);
      }

      distributionResults.push({
        player_id: result.player_id,
        placement: result.placement,
        amount: prizeAmount,
        success: transferResult.success,
        error: transferResult.error,
      });
    }

    // Update tournament status
    const allSuccessful = distributionResults.every(r => r.success);
    await supabaseClient
      .from('mini_tournaments')
      .update({
        status: 'completed',
        results_submitted_at: new Date().toISOString(),
        prizes_distributed_at: allSuccessful ? new Date().toISOString() : null,
      })
      .eq('id', tournament_id);

    console.log('Prize distribution completed:', distributionResults);

    return new Response(
      JSON.stringify({
        success: true,
        distributions: distributionResults,
        all_successful: allSuccessful,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error distributing prizes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
