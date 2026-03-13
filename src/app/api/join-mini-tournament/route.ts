import { NextResponse, NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    const { tournament_id, user_id } = body;

    if (!tournament_id || !user_id) {
       return NextResponse.json({ error: "Missing tournament_id or user_id" }, { status: 400 });
    }

    await adminDb.runTransaction(async (transaction) => {
      const tournamentRef = adminDb
        .collection("mini_tournaments")
        .doc(tournament_id);
      const userCreditsRef = adminDb.collection("user_credits").doc(user_id);
      const participantRef = adminDb
        .collection("mini_tournament_participants")
        .doc(`${tournament_id}_${user_id}`);

      const [tournamentDoc, userCreditsDoc, participantDoc] = await Promise.all(
        [
          transaction.get(tournamentRef),
          transaction.get(userCreditsRef),
          transaction.get(participantRef),
        ],
      );

      if (!tournamentDoc.exists) throw new Error("Torneio não encontrado");
      if (!userCreditsDoc.exists)
        throw new Error("Usuário não possui conta de créditos");
      if (participantDoc.exists)
        throw new Error("Você já está participando deste torneio");

      const tournament = tournamentDoc.data()!;
      if (tournament.status !== "published")
        throw new Error("Torneio não está com inscrições abertas");

      const currentParticipants = tournament.current_participants || 0;
      if (currentParticipants >= tournament.max_participants) {
        throw new Error("Torneio lotado");
      }

      const entryFee = tournament.entry_fee_brl || 0;
      const userBalance = userCreditsDoc.data()?.balance || 0;

      if (userBalance < (entryFee * 100)) { // Assuming balance is in 'cents' or credits where 100 units = 1 R$
        throw new Error("Saldo insuficiente para pagar a inscrição");
      }

      // Deduct credits (converting BRL to credit units)
      transaction.update(userCreditsRef, {
        balance: userBalance - (entryFee * 100),
        updated_at: new Date().toISOString(),
      });

      // Add participant
      transaction.set(participantRef, {
        tournament_id,
        player_id: user_id,
        registered_at: new Date().toISOString(),
        status: "confirmed",
      });

      // Update participant count
      transaction.update(tournamentRef, {
        current_participants: currentParticipants + 1,
      });

      // Record transaction
      const transactionRef = adminDb.collection("credit_transactions").doc();
      transaction.set(transactionRef, {
        user_id,
        amount: -Math.abs(entryFee), // Ensure it's a deduction
        type: "entry_fee",
        description: `Inscrição no Apostados FF: ${tournament.title}`,
        reference_id: tournament_id,
        created_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error joining mini tournament:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
