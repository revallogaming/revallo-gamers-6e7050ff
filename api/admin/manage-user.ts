import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, adminAuth, verifyToken } from "../../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);

    // Check if requester is admin
    const rolesSnapshot = await adminDb
      .collection("user_roles")
      .where("user_id", "==", decodedToken.uid)
      .where("role", "==", "admin")
      .get();

    if (rolesSnapshot.empty) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Admin access required" });
    }

    const { action, userId, amount, role, reason, newPassword } = req.body;

    if (!userId && action !== "stats") {
      return res.status(400).json({ error: "Missing userId" });
    }

    switch (action) {
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

      case "add_role":
        const roleRef = adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`);
        await roleRef.set({
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
        });
        break;

      case "remove_role":
        await adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`)
          .delete();
        break;

      case "toggle_ban": {
        const { banned } = req.body;
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
        const { type } = req.body;
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
        return res.status(400).json({ error: "Invalid action" });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error(`Error in admin manage-user (${req.body.action}):`, error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}
