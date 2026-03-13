"use client";

import { use, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useFollowers } from "@/hooks/useFollowers";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from "firebase/firestore";
import { Profile, Tournament, GAME_INFO, STATUS_INFO } from "@/types";
import { VerificationBadge } from "@/components/VerificationBadge";
import { GameIcon } from "@/components/GameIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  Calendar, 
  Clock,
  ChevronRight,
  Loader2,
  Gamepad2,
  Share2,
  User
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const { isFollowing, followerCount, followingCount, toggleFollow, isToggling } = useFollowers(profile?.id);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const q = query(
          collection(db, "profiles"),
          where("nickname", "==", username),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setProfile({ id: doc.id, ...doc.data() } as Profile);
        } else {
          // If not found by nickname, try by ID (fallback)
          const qById = query(
            collection(db, "profiles"),
            where("id", "==", username),
            limit(1)
          );
          const snapById = await getDocs(qById);
          if (!snapById.empty) {
             const docById = snapById.docs[0];
             setProfile({ id: docById.id, ...docById.data() } as Profile);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  useEffect(() => {
    async function fetchTournaments() {
      if (!profile?.id) return;
      try {
        const q = query(
          collection(db, "tournaments"),
          where("organizer_id", "==", profile.id),
          where("is_private", "==", false),
          limit(6)
        );
        const querySnapshot = await getDocs(q);
        setTournaments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tournament));
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoadingTournaments(false);
      }
    }
    fetchTournaments();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white">
        <Header />
        <div className="container py-32 text-center max-w-2xl mx-auto">
          <div className="h-20 w-20 rounded-[32px] bg-white/5 mx-auto flex items-center justify-center mb-10 opacity-20">
             <User size={40} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Perfil não encontrado</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-12 italic">O usuário que você busca não existe ou foi removido da plataforma.</p>
          <Button onClick={() => router.push("/")} className="bg-primary h-14 px-12 rounded-2xl font-black uppercase italic tracking-widest text-xs">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === profile.id;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white relative">
      <SEO title={`${profile.nickname} (@${profile.nickname}) - Revallo`} />
      <Header />

      <main className="container py-12 mx-auto px-4 max-w-7xl">
        {/* Profile Header section - same as private profile but social-only actions */}
        <section className="mb-16">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0D0B1A] border border-white/5 p-10 rounded-[40px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative shrink-0">
                    <Avatar className="h-40 w-40 border-4 border-primary/20 shadow-2xl">
                        <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-4xl font-black italic text-primary">
                            {profile.nickname?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-[#0D0B1A] p-1 rounded-full">
                        <VerificationBadge type={profile.verification_type as any} size="lg" />
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter break-words max-w-full">
                            {profile.nickname}
                        </h1>
                        <div className="flex items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">
                            <span className="flex items-center gap-2">
                                <span className="text-white text-lg tracking-tighter">{followerCount || 0}</span> Seguidores
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-white text-lg tracking-tighter">{followingCount || 0}</span> Seguindo
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-gray-400 font-medium italic leading-relaxed max-w-2xl mb-8">
                        {profile.bio || "Este player ainda não escreveu sua lenda na Revallo."}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {isOwnProfile ? (
                            <Link href="/profile">
                                <Button className="bg-primary h-12 px-10 rounded-2xl font-black uppercase italic tracking-widest text-[11px] shadow-lg shadow-primary/20">
                                    Meu Perfil
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Button 
                                  onClick={toggleFollow}
                                  disabled={isToggling}
                                  className={`h-12 px-12 rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all shadow-xl active:scale-95 ${
                                    isFollowing 
                                    ? "bg-white/5 border border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/20" 
                                    : "bg-primary text-white hover:opacity-90 shadow-primary/20"
                                  }`}
                                >
                                  {isFollowing ? "Seguindo" : "Seguir"}
                                </Button>
                                <Button className="bg-white/5 border border-white/10 h-12 px-6 rounded-2xl text-white">
                                    <MessageSquare size={18} />
                                </Button>
                                <Button 
                                  onClick={() => {
                                      const link = window.location.href;
                                      navigator.clipboard.writeText(link);
                                      toast.success("Link do perfil copiado!");
                                  }}
                                  className="bg-white/5 border border-white/10 h-12 px-6 rounded-2xl text-white"
                                >
                                    <Share2 size={18} />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* Tournaments Grid */}
        <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Torneios <span className="text-primary italic">Organizados</span></h3>
                <Link href="/tournaments">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors cursor-pointer italic">Ver todos</span>
                </Link>
            </div>

            {loadingTournaments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-white/2 animate-pulse rounded-[32px] border border-white/5" />)}
                </div>
            ) : tournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map(t => (
                        <Card key={t.id} className="bg-[#0D0B1A] border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/40 transition-all duration-500 relative aspect-[4/5]">
                             <img 
                                src={t.banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-60"
                                alt=""
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent p-8 flex flex-col justify-end">
                                 <Badge className="w-fit mb-4 bg-green-500 text-black text-[9px] font-black uppercase italic rounded-lg border-0 shadow-lg shadow-green-500/20">
                                    {STATUS_INFO[t.status]?.label || "Ativo"}
                                 </Badge>
                                 <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">{t.title}</h4>
                                 <p className="text-xl font-black italic text-primary mb-6 leading-none">{t.prize_description || "R$ 0,00"}</p>
                                 
                                 <div className="mb-8 text-[9px] font-black uppercase tracking-widest text-gray-500 italic">
                                     Criado em {format(new Date(t.created_at || Date.now()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                 </div>

                                 <div className="grid grid-cols-2 gap-3">
                                     <div className="bg-white/5 rounded-xl h-12 flex items-center justify-center gap-2 group-hover:bg-primary/20 transition-colors">
                                         <Users size={14} className="text-primary" />
                                         <span className="text-[10px] font-black italic text-white leading-none">{t.current_participants || 0}/{t.max_participants || 0}</span>
                                     </div>
                                     <Link href={`/tournaments/${t.id}`} className="block">
                                        <Button variant="ghost" className="w-full bg-white/5 rounded-xl h-12 flex items-center justify-center group-hover:bg-primary transition-colors text-white font-black italic uppercase text-[10px]">
                                            Ver Detalhes
                                        </Button>
                                     </Link>
                                 </div>
                             </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center bg-[#0D0B1A] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] border border-dashed border-white/5 rounded-[40px] opacity-20">
                    <Gamepad2 size={48} className="mx-auto mb-6 text-gray-600" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] italic text-gray-400">Nenhum torneio público encontrado</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
