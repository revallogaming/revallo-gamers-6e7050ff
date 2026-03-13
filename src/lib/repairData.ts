"use client";

import { db } from "./firebase";
import { collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

export async function repairTournamentData() {
  console.log("Starting data repair...");
  const collections = ["mini_tournaments", "matches", "tournaments"];
  let totalUpdated = 0;

  for (const colName of collections) {
    console.log(`Checking collection: ${colName}`);
    const snapshot = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const updates: any = {};

      // Fallback for entry_fee_brl
      if (!data.entry_fee_brl && data.entry_fee) {
        updates.entry_fee_brl = data.entry_fee / 100;
      }

      // Fallback for prize_pool_brl
      if (!data.prize_pool_brl && data.prize_pool_total) {
        updates.prize_pool_brl = data.prize_pool_total / 100;
      }
      
      // Fallback for prize_amount_brl (regular tournaments)
      if (!data.prize_amount_brl && data.prize_amount) {
        updates.prize_amount_brl = data.prize_amount / 100;
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc(db, colName, docSnap.id), updates);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Updated ${count} documents in ${colName}`);
      totalUpdated += count;
    }
  }

  console.log(`Repair complete. Total documents updated: ${totalUpdated}`);
  return totalUpdated;
}
