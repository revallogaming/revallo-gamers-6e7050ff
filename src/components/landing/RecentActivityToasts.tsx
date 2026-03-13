"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  where,
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface Activity {
  id: string;
  type: 'user' | 'tournament' | 'lfg';
  username: string;
  avatar?: string;
  message: string;
  createdAt: Date;
}

export function RecentActivityToasts() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isMobile = useIsMobile();

  useEffect(() => {
    let isMounted = true;
    const fetchActivities = async () => {
      try {
        const activitiesList: Activity[] = [];
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000); // Reduce range for performance
        const last30mTimestamp = Timestamp.fromDate(thirtyMinAgo);

        // 1. Fetch newest users (last 30min or last 3)
        const usersSnap = await getDocs(query(
          collection(db, "users"), 
          orderBy("createdAt", "desc"), 
          limit(3)
        ));
        
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          activitiesList.push({
            id: doc.id,
            type: 'user',
            username: data.nickname || data.displayName || "Gamer",
            avatar: data.avatar_url || data.photoURL,
            message: "entrou na Revallo",
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        // 2. Fetch newest tournament participants
        const participantsSnap = await getDocs(query(
          collection(db, "tournament_participants"), 
          orderBy("registered_at", "desc"), 
          limit(3)
        ));
        
        participantsSnap.docs.forEach(doc => {
          const data = doc.data();
          activitiesList.push({
            id: doc.id,
            type: 'tournament',
            username: data.nickname || "Gamer",
            avatar: data.avatar_url,
            message: "entrou em um torneio",
            createdAt: data.registered_at instanceof Timestamp ? data.registered_at.toDate() : new Date(data.registered_at),
          });
        });

        if (!isMounted) return;

        // Shuffle with Fisher-Yates so each page load shows a different order
        for (let i = activitiesList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [activitiesList[i], activitiesList[j]] = [activitiesList[j], activitiesList[i]];
        }
        setActivities(activitiesList);

        // Start at a random index so first notification is also random
        const randomStart = Math.floor(Math.random() * Math.max(activitiesList.length, 1));
        setTimeout(() => {
          if (isMounted) setCurrentIndex(randomStart);
        }, 5000);
      } catch (error) {
        console.error("Error fetching activity toasts:", error);
      }
    };

    fetchActivities();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (currentIndex === -1 || activities.length === 0) return;

    // Stop timer if tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause by not setting next timeout
      } else {
        // Resume
        setCurrentIndex((prev) => (prev + 1) % activities.length);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const delay = isMobile ? 12000 : 8000;
    const timer = setTimeout(() => {
      if (!document.hidden) {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentIndex, activities, isMobile]);

  const formatRelativeTime = (date: Date) => {
    const diffInMinutes = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 2) return "agora";
    if (diffInMinutes < 60) return `há ${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) { // Less than 24h
        const hours = Math.floor(diffInMinutes / 60);
        return `há ${hours}h atrás`;
    }
    return "recentemente"; // Fallback for anything older to avoid "days"
  };

  const currentActivity = activities[currentIndex];

  return (
    <div className="fixed top-24 right-4 md:right-6 z-[100] pointer-events-none w-full max-w-[320px]">
      <AnimatePresence mode="wait">
        {currentActivity && (
          <motion.div
            key={currentActivity.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-[#0D0B1A]/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl shadow-black/80 pointer-events-auto mx-4 md:mx-0"
          >
            <Avatar className="h-10 w-10 rounded-xl border border-white/10 shrink-0">
              <AvatarImage src={currentActivity.avatar} />
              <AvatarFallback className="bg-primary/10 text-xs font-black italic text-primary">
                {currentActivity.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-black italic uppercase tracking-tighter text-white truncate">
                {currentActivity.username}
              </p>
              <p className="text-[11px] font-medium text-white/70 leading-tight">
                {currentActivity.message}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mt-1">
                • {formatRelativeTime(currentActivity.createdAt)}
              </p>
            </div>
            
            <div className="h-full items-start pt-1">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(108,92,231,1)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
