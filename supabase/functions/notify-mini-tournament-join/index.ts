import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { tournament_id, player_id } = await req.json();

    console.log(`Notifying organizer about new participant in tournament ${tournament_id}`);

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('mini_tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Torneio não encontrado');
    }

    // Get player details
    const { data: player, error: playerError } = await supabaseClient
      .from('profiles')
      .select('nickname')
      .eq('id', player_id)
      .single();

    if (playerError) {
      console.error('Error fetching player:', playerError);
    }

    // Get organizer email from auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.getUserById(
      tournament.organizer_id
    );

    if (authError || !authData?.user?.email) {
      console.error('Error fetching organizer email:', authError);
      return new Response(
        JSON.stringify({ success: false, message: 'Organizer email not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const organizerEmail = authData.user.email;
    const playerName = player?.nickname || 'Um jogador';

    // Send email via SMTP
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'SMTP not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    const tournamentUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/Apostados/${tournament_id}`;

    await client.send({
      from: smtpUser,
      to: organizerEmail,
      subject: `🎮 Novo jogador inscrito - ${tournament.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">
                  🎮 Novo Jogador!
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                  Olá! <strong style="color: #a855f7;">${playerName}</strong> acabou de se inscrever no seu mini torneio:
                </p>
                
                <div style="background-color: #1f1f1f; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                  <h2 style="color: #fff; margin: 0 0 12px; font-size: 20px;">
                    ${tournament.title}
                  </h2>
                  <p style="color: #a1a1a1; margin: 0; font-size: 14px;">
                    Participantes: <strong style="color: #e5e5e5;">${tournament.current_participants + 1}/${tournament.max_participants}</strong>
                  </p>
                  <p style="color: #a1a1a1; margin: 8px 0 0; font-size: 14px;">
                    Prêmio: <strong style="color: #22c55e;">R$ ${tournament.prize_pool_brl.toFixed(2)}</strong>
                  </p>
                </div>

                <p style="color: #a1a1a1; font-size: 14px; text-align: center; margin: 0;">
                  Gerencie seu torneio no painel do organizador
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #0a0a0a; padding: 24px; text-align: center; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  © 2025 Revallo. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    await client.close();

    console.log(`Email notification sent to ${organizerEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
