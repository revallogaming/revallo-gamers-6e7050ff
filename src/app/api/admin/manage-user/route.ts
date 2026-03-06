import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);

    // Check for bypass key in headers
    const bypassKey = req.headers.get("x-admin-key");
    const isAuthorizedViaKey = bypassKey === "Adiel&Adryan2026@!";

    // Check if requester is admin in Firestore
    const rolesSnapshot = await adminDb
      .collection("user_roles")
      .where("user_id", "==", decodedToken.uid)
      .where("role", "==", "admin")
      .get();

    const isAdminInDb = !rolesSnapshot.empty;

    if (!isAdminInDb && !isAuthorizedViaKey) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action, userId, amount, role, reason, newPassword, nickname, avatar_url } = body;

    if (!userId && action !== "stats") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    switch (action) {
      case "update_user":
        await adminDb.collection("profiles").doc(userId).update({
          nickname: nickname,
          avatar_url: avatar_url || null,
          updated_at: new Date().toISOString(),
        });
        break;

      case "add_credits":
        await adminDb.runTransaction(async (transaction) => {
          const creditsRef = adminDb.collection("user_credits").doc(userId);
          const creditsDoc = await transaction.get(creditsRef);
          const currentBalance = creditsDoc.exists
            ? creditsDoc.data()?.balance || 0
            : 0;
          transaction.set(
            creditsRef,
            {
              balance: currentBalance + amount,
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );

          // Record transaction
          const transRef = adminDb.collection("credit_transactions").doc();
          transaction.set(transRef, {
            user_id: userId,
            amount: amount,
            type: amount > 0 ? "admin_add" : "admin_remove",
            description: `Administrativo: ${amount > 0 ? "Adição" : "Remoção"} de créditos`,
            created_at: new Date().toISOString(),
          });
        });
        break;

      case "set_credits":
        await adminDb.collection("user_credits").doc(userId).set(
          {
            balance: amount,
            updated_at: new Date().toISOString(),
          },
          { merge: true },
        );
        break;

      case "add_role": {
        const roleRef = adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`);
        await roleRef.set({
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
        });

        // Specific logic: if promoting to admin, give unlimited credits
        if (role === "admin") {
          await adminDb.collection("user_credits").doc(userId).set(
            {
              balance: 999999999, // Represents infinity in the UI
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );
        }
        break;
      }

      case "remove_role":
        await adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`)
          .delete();
        break;

      case "toggle_ban": {
        const { banned } = body;
        await adminDb
          .collection("profiles")
          .doc(userId)
          .update({
            is_banned: banned,
            ban_reason: reason || null,
            updated_at: new Date().toISOString(),
          });
        break;
      }

      case "delete_user": {
        // Delete from Auth
        await adminAuth.deleteUser(userId);
        // Delete profile, credits, roles
        await adminDb.collection("profiles").doc(userId).delete();
        await adminDb.collection("user_credits").doc(userId).delete();
        const userRoles = await adminDb
          .collection("user_roles")
          .where("user_id", "==", userId)
          .get();
        const batch = adminDb.batch();
        userRoles.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        break;
      }

      case "reset_password":
        await adminAuth.updateUser(userId, {
          password: newPassword,
        });
        break;

      case "update_verification": {
        const { type } = body;
        await adminDb
          .collection("profiles")
          .doc(userId)
          .update({
            verification_type: type,
            updated_at: new Date().toISOString(),
          });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(`Error in admin manage-user:`, error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
