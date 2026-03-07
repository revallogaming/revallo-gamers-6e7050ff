import { NextResponse, NextRequest } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, winners } = body; // winners: [{ player_id, placement, amount }]

    if (!tournament_id || !winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tournamentRef = adminDb.collection("tournaments").doc(tournament_id);
    const tournamentDoc = await tournamentRef.get();

    if (!tournamentDoc.exists) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
    }

    const tournament = tournamentDoc.data()!;
    if (tournament.organizer_id !== userId) {
      return NextResponse.json({ error: "Apenas o organizador pode distribuir prêmios" }, { status: 403 });
    }

    // Prevent re-distribution if already completed
    if (tournament.status === "completed" && tournament.prizes_distributed_at) {
      return NextResponse.json({ error: "Prêmios já distribuídos para este torneio" }, { status: 400 });
    }

    // Budget Validation
    const totalDistribution = winners.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
    const prizePool = tournament.prize_pool_total || tournament.prize_amount || 0;
    if (prizePool > 0 && totalDistribution > prizePool * 1.01) { // 1% tolerance for rounding
      return NextResponse.json({
        error: `Total de distribuição (R$ ${totalDistribution.toFixed(2)}) excede o fundo de prêmios (R$ ${prizePool.toFixed(2)})`
      }, { status: 400 });
    }

    console.log(`Starting prize distribution for tournament ${tournament_id} by user ${userId}`);

    const results = [];

    for (const winner of winners) {
      if (!winner.player_id || !winner.amount || winner.amount <= 0) {
        results.push({ player_id: winner.player_id, status: "skipped", error: "Dados inválidos" });
        continue;
      }

      // Idempotency Check
      const existingPayout = await adminDb
        .collection("prize_distributions")
        .where("tournament_id", "==", tournament_id)
        .where("player_id", "==", winner.player_id)
        .where("status", "==", "confirmed")
        .limit(1)
        .get();

      if (!existingPayout.empty) {
        results.push({ player_id: winner.player_id, status: "skipped", error: "Pagamento já realizado" });
        continue;
      }

      // Get participant PIX key
      const participantSnap = await adminDb
        .collection("tournament_participants")
        .where("tournament_id", "==", tournament_id)
        .where("player_id", "==", winner.player_id)
        .limit(1)
        .get();

      if (participantSnap.empty) {
        results.push({ player_id: winner.player_id, status: "failed", error: "Participante não encontrado" });
        continue;
      }

      const participantData = participantSnap.docs[0].data();
      const pixKey = participantData.pix_key;
      const pixType = participantData.pix_key_type;

      if (!pixKey || !pixType) {
        results.push({ player_id: winner.player_id, status: "failed", error: "Chave PIX não registrada (Capitão precisa cadastrar)" });
        continue;
      }

      try {
        console.log(`Processing payout for player ${winner.player_id}: R$ ${winner.amount}`);
        // NOTE: Real MP disbursement API call would go here.
        // Record payout in Firestore
        const distributionRef = await adminDb.collection("prize_distributions").add({
          tournament_id,
          player_id: winner.player_id,
          amount_brl: winner.amount,
          placement: winner.placement,
          pix_key: pixKey,
          pix_type: pixType,
          status: "confirmed", // Simulated
          created_at: new Date().toISOString(),
          transfer_id: "SIM_MP_" + Math.random().toString(36).substr(2, 9)
        });

        // Update participant record
        await participantSnap.docs[0].ref.update({
          placement: winner.placement,
          prize_amount_brl: winner.amount,
          prize_paid: true,
          prize_paid_at: new Date().toISOString(),
          distribution_id: distributionRef.id
        });

        results.push({ player_id: winner.player_id, status: "success" });

      } catch (mpError: any) {
        console.error(`MP Transfer Error for player ${winner.player_id}:`, mpError.response?.data || mpError.message);
        results.push({ player_id: winner.player_id, status: "failed", error: "Erro no processamento do pagamento" });
      }
    }

    const failedCount = results.filter(r => r.status === "failed").length;
    if (failedCount === 0) {
      console.log(`All prizes for tournament ${tournament_id} distributed successfully.`);
      await tournamentRef.update({
        status: "completed",
        prizes_distributed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      console.warn(`Tournament ${tournament_id} had ${failedCount} distribution failures.`);
      await tournamentRef.update({ updated_at: new Date().toISOString() });
    }

    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        failed: failedCount,
        skipped: results.filter(r => r.status === "skipped").length,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Distribution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
