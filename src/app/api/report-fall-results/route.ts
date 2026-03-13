import { NextResponse, NextRequest } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {}

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournamentId, fallId, results } = body;

    if (!tournamentId || !fallId || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await adminDb.runTransaction(async (transaction: any) => {
      // 1. Verify Organizer
      const tournamentRef = adminDb.collection("tournaments").doc(tournamentId);
      const tournamentDoc = await transaction.get(tournamentRef);

      if (!tournamentDoc.exists) throw new Error("Torneio não encontrado");
      const tournament = tournamentDoc.data()!;

      if (tournament.organizer_id !== userId) {
        throw new Error("Apenas o organizador pode reportar resultados");
      }

      // 2. Delete old results for this fall (for re-reporting)
      const oldResultsQuery = adminDb.collection("fall_results").where("fall_id", "==", fallId);
      const oldResultsSnap = await transaction.get(oldResultsQuery);
      oldResultsSnap.docs.forEach((d: any) => transaction.delete(d.ref));

      // 3. Add new results
      results.forEach((res: any) => {
        const resRef = adminDb.collection("fall_results").doc();
        transaction.set(resRef, {
          ...res,
          reported_by: userId,
          created_at: new Date().toISOString()
        });
      });

      // 4. Mark fall as completed
      const fallRef = adminDb.collection("tournament_falls").doc(fallId);
      transaction.update(fallRef, { 
        status: 'completed',
        updated_at: new Date().toISOString()
      });

      // 5. Recalculate and update participant stats
      // First, get all fall IDs for this tournament
      const fallsSnap = await adminDb.collection("tournament_falls")
        .where("tournament_id", "==", tournamentId)
        .get();
      const fallIds = fallsSnap.docs.map((d: any) => d.id);

      // Get all results for these falls
      // Note: In a transaction, we use transaction.get()
      const resultsSubQuery = adminDb.collection("fall_results").where("fall_id", "in", fallIds);
      const resultsSnap = await transaction.get(resultsSubQuery);
      
      const allResults = resultsSnap.docs.map((d: any) => d.data());
      // Plus the new results we JUST set (since they aren't in the snapshot yet)
      results.forEach((r: any) => allResults.push(r));

      const participantStats: Record<string, any> = {};

      allResults.forEach((res: any) => {
        if (!participantStats[res.participant_id]) {
          participantStats[res.participant_id] = {
            total_points: 0,
            total_kills: 0,
            booyahs: 0,
            best_placement: 100,
          };
        }
        const stats = participantStats[res.participant_id];
        stats.total_points += res.points;
        stats.total_kills += res.kills;
        if (res.placement === 1) stats.booyahs += 1;
        if (res.placement < stats.best_placement) stats.best_placement = res.placement;
      });

      // Update participant documents
      for (const [pId, stats] of Object.entries(participantStats)) {
        const pRef = adminDb.collection("tournament_participants").doc(pId);
        transaction.update(pRef, stats);
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error reporting fall results:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
