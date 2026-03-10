"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export function VisitorTracker() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const trackVisit = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sessionKey = `revallo_visit_${today}`;
      
      if (!sessionStorage.getItem(sessionKey)) {
        try {
          const statsRef = doc(db, 'site_stats', today);
          const updateData: any = {
            visitors: increment(1),
            last_updated: serverTimestamp()
          };

          if (user) {
            updateData.visitors_logged = increment(1);
          } else {
            updateData.visitors_guest = increment(1);
          }

          await setDoc(statsRef, updateData, { merge: true });
          sessionStorage.setItem(sessionKey, 'true');
        } catch (error) {
          console.error("Error tracking visit:", error);
        }
      }
    };

    trackVisit();
  }, [user, loading]);

  return null;
}
