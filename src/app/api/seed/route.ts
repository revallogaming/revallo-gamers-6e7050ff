import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function GET() {
  const seedUsers = [
    {
      nickname: "RushKing",
      email: "zyrex@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369246/avatars/h9lota7vcdkj97i9xqww.png",
    },
    {
      nickname: "Ghost_FF",
      email: "kryon@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369245/avatars/lyashwzjesfulynrnr7v.png",
    },
    {
      nickname: "Shadow_Mestre",
      email: "vexor@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369248/avatars/kekvu2ltqvuaxllbfiec.png",
    },
    {
      nickname: "Lira_Rush",
      email: "drayx@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369247/avatars/mzlcf4s7n6oy4n9chcju.png",
    },
    {
      nickname: "Viper_FF",
      email: "zorik@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369243/avatars/wz9vm2agdkvcchvbrgxh.png",
    },
    {
      nickname: "Nexus_Gamer",
      email: "nyrox@revallo.com.br",
      password: "GamerPassword123!",
      avatar: "https://res.cloudinary.com/db8uqft43/image/upload/v1773369246/avatars/h9lota7vcdkj97i9xqww.png",
    }
  ];

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const seedTournaments = [
    {
      title: "Elite Fire Championship",
      game: "freefire",
      prize_amount_brl: 1200,
      prize_description: "R$ 1.200,00 para o Squad Campeão",
      entry_fee_brl: 50,
      max_participants: 12,
      current_participants: 4,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364949/banners/dqk0ojc7lwe9p0jxipqy.png",
      description: "A maior liga competitiva da estação. Somente os melhores squads.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: true,
      fee_type: "per_team",
    },
    {
      title: "Battle Crown FF",
      game: "freefire",
      prize_amount_brl: 500,
      prize_description: "R$ 500,00 de premiação garantida",
      entry_fee_brl: 25,
      max_participants: 16,
      current_participants: 8,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364947/banners/rnm664xetug7fw0ehgfr.jpg",
      description: "Dedicado às jogadoras que buscam evoluir no cenário profissional.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: false,
      fee_type: "per_team",
    },
    {
      title: "Arena Masters FF",
      game: "freefire",
      prize_amount_brl: 250,
      prize_description: "R$ 250,00 para o Rei do X1",
      entry_fee_brl: 15,
      max_participants: 48,
      current_participants: 12,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364944/banners/wmdfgoq52oli4cyoop2m.jpg",
      description: "Prove sua habilidade individual nesta arena de gigantes.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: false,
      fee_type: "per_team",
    },
    {
      title: "Fire Legends Cup",
      game: "freefire",
      prize_amount_brl: 800,
      prize_description: "R$ 800,00 em prêmios",
      entry_fee_brl: 40,
      max_participants: 24,
      current_participants: 6,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364948/banners/scca78ak60bfz4m578ii.png",
      description: "Um torneio clássico para jogadores de elite.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: true,
      fee_type: "per_team",
    },
    {
      title: "Fire Nation Cup",
      game: "freefire",
      prize_amount_brl: 2500,
      prize_description: "R$ 2.500,00 Premiação Ouro",
      entry_fee_brl: 80,
      max_participants: 12,
      current_participants: 6,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364945/banners/enuguzplaceu920httcg.webp",
      description: "O maior torneio da semana. Vagas limitadas.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: true,
      fee_type: "per_player",
    },
    {
      title: "Grand Prix Free Fire",
      game: "freefire",
      prize_amount_brl: 240,
      prize_description: "R$ 240,00 para o campeão",
      entry_fee_brl: 25,
      max_participants: 8,
      current_participants: 4,
      status: "open",
      banner_url: "https://res.cloudinary.com/db8uqft43/image/upload/v1773364949/banners/dqk0ojc7lwe9p0jxipqy.png",
      description: "Torneio rápido para quem joga à noite.",
      start_date: nextWeek.toISOString(),
      registration_deadline: tomorrow.toISOString(),
      is_highlighted: false,
      fee_type: "per_team",
    }
  ];

  const seedLFG = [
    {
      title: "Buscando Suporte para 4x4",
      game: "freefire",
      rank: "Mestre",
      region: "SA",
      style: "Competitive",
      description: "Preciso de um suporte experiente para treinos diários e torneios amadores.",
      slots: [
        { role: "Suporte", filled: false },
        { role: "Rush", filled: true, userId: "fake_id_1" }
      ],
      status: "open",
    },
    {
      title: "Squad para Liga de Terça",
      game: "freefire",
      rank: "Diamante+",
      region: "SA",
      style: "Competitive",
      description: "Buscando jogadoras focadas para completar o squad da Liga Feminina.",
      slots: [
        { role: "Qualquer", filled: false },
        { role: "Qualquer", filled: false }
      ],
      status: "open",
    },
    {
      title: "X1 para Treinar Gelinho",
      game: "freefire",
      rank: "Platina",
      region: "SA",
      style: "Casual",
      description: "Só para treinar movimento e gelo rápido. Sem toxidade.",
      slots: [
        { role: "Oponente", filled: false }
      ],
      status: "open",
    },
    {
      title: "Scrims de Noite - Preciso de Grenadeiro",
      game: "freefire",
      rank: "Elite",
      region: "SA",
      style: "Scrims",
      description: "Nosso grenadeiro saiu, precisamos de um fixo para jogar scrims todo dia às 20h.",
      slots: [
        { role: "Grenadeiro", filled: false },
        { role: "Capitão", filled: true, userId: "fake_id_2" }
      ],
      status: "open",
    },
    {
      title: "Rushador para Squad Full Rush",
      game: "freefire",
      rank: "Desafiante",
      region: "SA",
      style: "Competitive",
      description: "Estilo agressivo. Precisa ter call e saber jogar em equipe.",
      slots: [
        { role: "Rushador", filled: false }
      ],
      status: "open",
    },
    {
      title: "Duo para Subir Rank",
      game: "freefire",
      rank: "Ouro IV",
      region: "SA",
      style: "Casual",
      description: "Buscando alguém para jogar ranqueada agora de tarde.",
      slots: [
        { role: "Duo", filled: false }
      ],
      status: "open",
    }
  ];

  const titles = seedTournaments.map(t => t.title);

  try {
    const results = [];

    // Aggressive cleanup: delete ALL tournaments before seeding
    const allTournaments = await adminDb.collection("tournaments").get();
    const cleanupBatch = adminDb.batch();
    allTournaments.docs.forEach((doc: any) => cleanupBatch.delete(doc.ref));
    await cleanupBatch.commit();

    const seedUserResults: any[] = [];

    for (let i = 0; i < seedUsers.length; i++) {
      const u = seedUsers[i];
      const fullAvatarUrl = u.avatar.startsWith("http") ? u.avatar : `https://revallo.com.br${u.avatar}`;
      
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(u.email);
        await adminAuth.updateUser(userRecord.uid, { 
          photoURL: fullAvatarUrl,
          displayName: u.nickname 
        });
      } catch (e) {
        userRecord = await adminAuth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.nickname,
          photoURL: fullAvatarUrl,
        });
      }

      await adminDb.collection("profiles").doc(userRecord.uid).set({
        id: userRecord.uid,
        nickname: u.nickname,
        avatar_url: u.avatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_banned: false,
        is_highlighted: i === 0,
      }, { merge: true });

      await adminDb.collection("user_credits").doc(userRecord.uid).set({
        user_id: userRecord.uid,
        balance: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { merge: true });
      
      await adminDb.collection("user_roles").doc(`${userRecord.uid}_organizer`).set({
        user_id: userRecord.uid,
        role: "organizer",
        created_at: new Date().toISOString(),
      }, { merge: true });

      // Tournament distribution
      const tournamentsPerUser = Math.ceil(seedTournaments.length / seedUsers.length);
      for (let j = 0; j < tournamentsPerUser; j++) {
        const tIndex = i * tournamentsPerUser + j;
        if (tIndex < seedTournaments.length) {
          const t = seedTournaments[tIndex];
          const tournamentRef = adminDb.collection("tournaments").doc();
          await tournamentRef.set({
            ...t,
            id: tournamentRef.id,
            organizer_id: userRecord.uid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            participants: [],
            community_id: null,
          });
        }
      }

      // LFG distribution
      const lfgPerUser = Math.ceil(seedLFG.length / seedUsers.length);
      for (let j = 0; j < lfgPerUser; j++) {
        const lIndex = i * lfgPerUser + j;
        if (lIndex < seedLFG.length) {
          const lfg = seedLFG[lIndex];
          const lfgRef = adminDb.collection("lfg_ads").doc();
          await lfgRef.set({
            ...lfg,
            authorId: userRecord.uid,
            authorName: u.nickname,
            authorPhoto: u.avatar,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      seedUserResults.push({ email: u.email, password: u.nickname });
    }

    return NextResponse.json({ success: true, created: seedUserResults });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
