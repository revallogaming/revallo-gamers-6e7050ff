import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const MASTER_KEY = "Adiel&Adryan2026@!";
const SYSTEM_OWNER_ID = "tjYoxEwnOAf1WmCJpWG0";

export async function POST(req: NextRequest) {
  try {
    const { action, key, data } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Chave de acesso não fornecida" }, { status: 401 });
    }

    // 1. Identify User from Key
    let authorizedUserId: string | null = null;
    let isOwner = false;

    if (key === MASTER_KEY) {
      authorizedUserId = SYSTEM_OWNER_ID;
      isOwner = true;
    } else {
      // Check for staff key in Firestore
      const rolesSnapshot = await adminDb.collection("user_roles")
        .where("role", "==", "admin")
        .where("admin_access_key", "==", key)
        .limit(1)
        .get();

      if (!rolesSnapshot.empty) {
        authorizedUserId = rolesSnapshot.docs[0].data().user_id;
      }
    }

    if (!authorizedUserId) {
      return NextResponse.json({ error: "Chave de acesso inválida" }, { status: 403 });
    }

    // 2. Process Actions
    switch (action) {
      case "validate":
        return NextResponse.json({ 
          success: true, 
          uid: authorizedUserId,
          isOwner 
        });

      case "get_users":
        const profilesSnap = await adminDb.collection("profiles").get();
        const creditsSnap = await adminDb.collection("user_credits").get();
        const rolesSnap = await adminDb.collection("user_roles").get();

        const profiles = profilesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        const credits = creditsSnap.docs.map((d: any) => d.data());
        const roles = rolesSnap.docs.map((d: any) => d.data());

        const usersWithCredits = profiles.map((profile: any) => {
          const userCredits = credits?.find((c: any) => c.user_id === profile.id);
          const userRoles = roles?.filter((r: any) => r.user_id === profile.id).map((r: any) => r.role) || [];
          
          return {
            ...profile,
            balance: userCredits?.balance || 0,
            roles: userRoles,
            admin_access_key: roles?.find((r: any) => r.user_id === profile.id && r.role === 'admin')?.admin_access_key
          };
        });

        return NextResponse.json({ users: usersWithCredits });

      case "update_credits":
        const { userId, amount, type, description } = data;
        
        const creditDoc = adminDb.collection("user_credits").doc(userId);
        const currentSnap = await creditDoc.get();
        const currentBalance = currentSnap.exists ? currentSnap.data()?.balance || 0 : 0;
        
        await creditDoc.set({ 
          balance: currentBalance + amount, 
          user_id: userId,
          updated_at: new Date().toISOString()
        }, { merge: true });

        await adminDb.collection("credit_transactions").add({
          user_id: userId,
          amount,
          type,
          description,
          created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true });

      case "set_credits":
        const { userId: sUserId, amount: sAmount } = data;
        await adminDb.collection("user_credits").doc(sUserId).set({
          balance: sAmount,
          user_id: sUserId,
          updated_at: new Date().toISOString()
        }, { merge: true });

        await adminDb.collection("credit_transactions").add({
          user_id: sUserId,
          amount: sAmount,
          type: "admin_set",
          description: "Saldo definido por administrador",
          created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true });

      case "update_verification":
        const { vUserId, vType } = data;
        await adminDb.collection("profiles").doc(vUserId).update({
          verification_type: vType,
          updated_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true });

      case "add_admin_role":
        const { aUserId, aKey } = data;
        await adminDb.collection("user_roles").doc(`${aUserId}_admin`).set({
          user_id: aUserId,
          role: "admin",
          admin_access_key: aKey,
          created_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true });

      case "remove_admin_role":
        const { rUserId } = data;
        if (rUserId === SYSTEM_OWNER_ID) {
          return NextResponse.json({ error: "O dono do sistema não pode ser removido" }, { status: 400 });
        }
        await adminDb.collection("user_roles").doc(`${rUserId}_admin`).delete();
        return NextResponse.json({ success: true });

      case "delete_user":
        const { dUserId } = data;
        if (dUserId === SYSTEM_OWNER_ID) {
          return NextResponse.json({ error: "O dono do sistema não pode ser deletado" }, { status: 400 });
        }
        
        console.log(`[Admin Proxy] Deletando usuário: ${dUserId}`);
        
        const deleteBatch = adminDb.batch();
        
        // 1. Delete from profiles
        deleteBatch.delete(adminDb.collection("profiles").doc(dUserId));
        
        // 2. Delete from user_credits
        deleteBatch.delete(adminDb.collection("user_credits").doc(dUserId));
        
        // 3. Delete from user_roles (find all roles for this user)
        const userRolesSnapshot = await adminDb.collection("user_roles")
          .where("user_id", "==", dUserId)
          .get();
        
        userRolesSnapshot.docs.forEach((doc: any) => {
          deleteBatch.delete(doc.ref);
        });
        
        await deleteBatch.commit();
        console.log(`[Admin Proxy] Documentos do usuário ${dUserId} removidos do Firestore`);

        // 4. Delete from Firebase Auth (if possible)
        try {
          const { adminAuth } = await import("@/lib/firebaseAdmin");
          await adminAuth.deleteUser(dUserId);
          console.log(`[Admin Proxy] Usuário ${dUserId} removido do Auth`);
        } catch (authError: any) {
          console.error(`[Admin Proxy] Erro ao deletar do Auth (usuário pode não existir no Auth):`, authError.message);
          // Don't fail the whole request if Auth deletion fails (e.g. user already deleted from Auth)
        }

        return NextResponse.json({ success: true });

      case "toggle_ban":
        const { bUserId, isBanned, reason } = data;
        if (bUserId === SYSTEM_OWNER_ID && isBanned) {
          return NextResponse.json({ error: "O dono do sistema não pode ser banido" }, { status: 400 });
        }
        await adminDb.collection("profiles").doc(bUserId).update({
          is_banned: isBanned,
          ban_reason: reason || null,
          updated_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Admin Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}
