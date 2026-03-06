import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, winners } = req.body; // winners: [{ player_id, placement, amount }]

    if (!tournament_id || !winners || !Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tournamentRef = adminDb.collection("tournaments").doc(tournament_id);
    const tournamentDoc = await tournamentRef.get();

    if (!tournamentDoc.exists) {
      return res.status(404).json({ error: "Torneio não encontrado" });
    }

    const tournament = tournamentDoc.data()!;
    if (tournament.organizer_id !== userId) {
      return res.status(403).json({ error: "Apenas o organizador pode distribuir prêmios" });
    }

    // Prevent re-distribution if already completed
    if (tournament.status === "completed" && tournament.prizes_distributed_at) {
      return res.status(400).json({ error: "Prêmios já distribuídos para este torneio" });
    }

    // ── Budget Validation ────────────────────────────────────────────────────
    const totalDistribution = winners.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
    const prizePool = tournament.prize_pool_total || tournament.prize_amount || 0;
    if (prizePool > 0 && totalDistribution > prizePool * 1.01) { // 1% tolerance for rounding
      return res.status(400).json({
        error: `Total de distribuição (R$ ${totalDistribution.toFixed(2)}) excede o fundo de prêmios (R$ ${prizePool.toFixed(2)})`
      });
    }

    const results = [];

    for (const winner of winners) {
      if (!winner.player_id || !winner.amount || winner.amount <= 0) {
        results.push({ player_id: winner.player_id, status: "skipped", error: "Dados inválidos" });
        continue;
      }

      // ── Idempotency Check ──────────────────────────────────────────────────
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

      // ── Get participant PIX key ────────────────────────────────────────────
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

      const participant = participantSnap.docs[0].data();
      const pixKey = participant.pix_key;
      const pixType = participant.pix_key_type;

      if (!pixKey || !pixType) {
        results.push({ player_id: winner.player_id, status: "failed", error: "Chave PIX não registrada" });
        continue;
      }

      // ── Mercado Pago Payout ────────────────────────────────────────────────
      try {
        // NOTE: Real MP disbursement API call would go here.
        // Uncomment and configure when MP account supports payouts.
        /*
        const mpResponse = await axios.post("https://api.mercadopago.com/v1/disbursements", {
          transaction_amount: winner.amount,
          description: `Prêmio Torneio: ${tournament.title} - ${winner.placement}º Lugar`,
          payer: { email: "financeiro@revallogamers.com.br" },
          receiver: { pix: { key: pixKey, key_type: pixType } },
          metadata: { tournament_id, player_id: winner.player_id, placement: winner.placement }
        }, {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
        });
        */

        // Record payout in Firestore
        await adminDb.collection("prize_distributions").add({
          tournament_id,
          player_id: winner.player_id,
          amount_brl: winner.amount,
          placement: winner.placement,
          pix_key: pixKey,
          status: "confirmed", // Simulated — change to "pending" when real MP is integrated
          created_at: new Date().toISOString(),
          transfer_id: "SIM_MP_" + Math.random().toString(36).substr(2, 9)
        });

        // Update participant record
        await participantSnap.docs[0].ref.update({
          placement: winner.placement,
          prize_amount_brl: winner.amount,
          prize_paid: true,
          prize_paid_at: new Date().toISOString()
        });

        results.push({ player_id: winner.player_id, status: "success" });

      } catch (mpError: any) {
        console.error("MP Transfer Error:", mpError.response?.data || mpError.message);
        results.push({ player_id: winner.player_id, status: "failed", error: "Erro no processamento do pagamento" });
      }
    }

    // ── Mark tournament as completed ONLY if ALL succeeded (or skipped idempotently) ──
    const failedCount = results.filter(r => r.status === "failed").length;
    if (failedCount === 0) {
      await tournamentRef.update({
        status: "completed",
        prizes_distributed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      // Partial failure: don't mark as completed so organizer can retry
      await tournamentRef.update({ updated_at: new Date().toISOString() });
    }

    return res.status(200).json({
      success: failedCount === 0,
      results,
      summary: {
        total: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        failed: failedCount,
        skipped: results.filter(r => r.status === "skipped").length,
      }
    });

  } catch (error: any) {
    console.error("Distribution Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
