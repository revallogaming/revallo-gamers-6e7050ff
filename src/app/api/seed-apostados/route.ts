import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function GET() {
  try {
    const viperUser = {
      nickname: "Zyrex",
      email: "viperff@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369246/avatars/h9lota7vcdkj97i9xqww.png",
    };

    let userRecord;
    const fullAvatarUrl = viperUser.avatar;
    
    try {
      userRecord = await adminAuth.getUserByEmail(viperUser.email);
    } catch (e) {
      userRecord = await adminAuth.createUser({
        email: viperUser.email,
        password: viperUser.password,
        displayName: viperUser.nickname,
        photoURL: fullAvatarUrl,
      });
    }

    const uid = userRecord.uid;

    // Ensure Profile
    await adminDb.collection("profiles").doc(uid).set({
      id: uid,
      nickname: viperUser.nickname,
      avatar_url: viperUser.avatar,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_banned: false,
      is_highlighted: true,
      verification_type: "influencer"
    }, { merge: true });

    // Ensure Credits
    await adminDb.collection("user_credits").doc(uid).set({
      user_id: uid,
      balance: 5000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { merge: true });

    // Ensure Role
    await adminDb.collection("user_roles").doc(`${uid}_organizer`).set({
      user_id: uid,
      role: "organizer",
      created_at: new Date().toISOString(),
    }, { merge: true });

    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(21, 0, 0, 0);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const seedApostados = [
      {
        title: "#REV-928",
        game: "freefire",
        format: "x1",
        max_participants: 2,
        current_participants: 1,
        entry_fee_brl: 50.00,
        prize_pool_brl: 90.00,
        status: "open",
        deposit_confirmed: true,
        banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364949/banners/dqk0ojc7lwe9p0jxipqy.png",
        start_date: tonight.toISOString(),
        registration_deadline: new Date(tonight.getTime() - 3600000).toISOString(),
        description: "X1 Apostado de alto nível. Regras: Sem granada, sem CR7, sem cura.",
        prize_distribution: [
          { place: 1, percentage: 100 }
        ]
      },
      {
        title: "#REV-182",
        game: "freefire",
        format: "squad",
        max_participants: 8,
        current_participants: 4,
        entry_fee_brl: 25.00,
        prize_pool_brl: 180.00, // 25 * 8 * 0.9 = 180
        fee_type: "per_player",
        status: "open",
        deposit_confirmed: true,
        banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364947/banners/rnm664xetug7fw0ehgfr.jpg",
        start_date: tomorrow.toISOString(),
        registration_deadline: new Date(tomorrow.getTime() - 7200000).toISOString(),
        description: "Apostado por squads. Premiação pesada. Organizador verificado.",
        prize_distribution: [
          { place: 1, percentage: 60 },
          { place: 2, percentage: 40 }
        ]
      },
      {
        title: "#REV-339",
        game: "freefire",
        format: "duo",
        max_participants: 12,
        current_participants: 6,
        entry_fee_brl: 30.00,
        prize_pool_brl: 324.00, // 30 * 12 * 0.9
        status: "open",
        deposit_confirmed: true,
        banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364944/banners/wmdfgoq52oli4cyoop2m.jpg",
        start_date: new Date(tonight.getTime() + 86400000 + 3600000 * 3).toISOString(),
        registration_deadline: tomorrow.toISOString(),
        description: "Duo vs Duo no Rush. Premiação dividida entre os melhores.",
        prize_distribution: [
          { place: 1, percentage: 100 }
        ]
      },
      {
        title: "#REV-882",
        game: "freefire",
        format: "x1",
        max_participants: 2,
        current_participants: 0,
        entry_fee_brl: 200.00,
        prize_pool_brl: 360.00,
        status: "open",
        deposit_confirmed: true,
        banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364948/banners/scca78ak60bfz4m578ii.png",
        start_date: tonight.toISOString(),
        registration_deadline: new Date(tonight.getTime() - 1800000).toISOString(),
        description: "O maior apostado da noite. Verificação de ID obrigatória.",
        prize_distribution: [
          { place: 1, percentage: 100 }
        ]
      }
    ];

    // Aggressive cleanup: delete ALL mini-tournaments before seeding
    const allApostados = await adminDb.collection("mini_tournaments").get();
    const cleanupBatch = adminDb.batch();
    allApostados.docs.forEach((doc: any) => cleanupBatch.delete(doc.ref));
    await cleanupBatch.commit();

    // Cleanup existing items from this user to avoid "GRÁTIS" duplicates
    const batch = adminDb.batch();
    const existingTourns = await adminDb.collection("mini_tournaments")
      .where("organizer_id", "==", uid)
      .get();
    
    existingTourns.docs.forEach((doc: any) => batch.delete(doc.ref));

    const existingMatches = await adminDb.collection("matches")
      .where("creator_id", "==", uid)
      .where("tournament_type", "==", "duel")
      .get();
    
    existingMatches.docs.forEach((doc: any) => batch.delete(doc.ref));
    
    await batch.commit();

    for (const t of seedApostados) {
      const tournRef = adminDb.collection("mini_tournaments").doc();
      await tournRef.set({
        ...t,
        id: tournRef.id,
        organizer_id: uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rules: "Regras padrão da comunidade Revallo.",
      });
    }

    return NextResponse.json({ success: true, uid, created: seedApostados.length });
  } catch (error: any) {
    console.error("Seed Apostados error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
