import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, results } = req.body;

    if (!tournament_id || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let allSuccessful = true;

    await adminDb.runTransaction(async (transaction) => {
      const tournamentRef = adminDb
        .collection("mini_tournaments")
        .doc(tournament_id);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) throw new Error("Torneio não encontrado");
      const tournament = tournamentDoc.data()!;

      if (tournament.organizer_id !== userId) {
        throw new Error("Apenas o organizador pode submeter resultados");
      }

      if (tournament.prizes_distributed_at) {
        throw new Error("Os prêmios já foram distribuídos");
      }

      // Update tournament status
      transaction.update(tournamentRef, {
        status: "completed",
        results_submitted_at: new Date().toISOString(),
        prizes_distributed_at: new Date().toISOString(),
      });

      // Update participants with placement and prize
      for (const res of results) {
        const participantRef = adminDb
          .collection("mini_tournament_participants")
          .doc(`${tournament_id}_${res.player_id}`);
        const dist = tournament.prize_distribution.find(
          (d: any) => d.place === res.placement,
        );

        if (dist) {
          const prizeAmount =
            (tournament.prize_pool_brl * dist.percentage) / 100;

          transaction.update(participantRef, {
            placement: res.placement,
            prize_amount_brl: prizeAmount,
            prize_paid: true,
            prize_paid_at: new Date().toISOString(),
          });

          // Add credits to player
          const userCreditsRef = adminDb
            .collection("user_credits")
            .doc(res.player_id);
          const userCreditsDoc = await transaction.get(userCreditsRef);

          if (userCreditsDoc.exists) {
            const currentBalance = userCreditsDoc.data()?.balance || 0;
            transaction.update(userCreditsRef, {
              balance: currentBalance + prizeAmount,
              updated_at: new Date().toISOString(),
            });
          } else {
            transaction.set(userCreditsRef, {
              user_id: res.player_id,
              balance: prizeAmount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          // Record transaction
          const transRef = adminDb.collection("credit_transactions").doc();
          transaction.set(transRef, {
            user_id: res.player_id,
            amount: prizeAmount,
            type: "prize_win",
            description: `Prêmio do mini torneio: ${tournament.title} (${res.placement}º lugar)`,
            reference_id: tournament_id,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    return res
      .status(200)
      .json({ success: true, all_successful: allSuccessful });
  } catch (error: any) {
    console.error("Error distributing prizes:", error);
    return res.status(400).json({ error: error.message });
  }
}
