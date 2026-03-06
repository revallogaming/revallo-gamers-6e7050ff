"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Plus,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTournamentDialog } from "@/components/CreateTournamentDialog";

interface Tournament {
  id: string;
  title: string;
  game: string;
  start_date?: string;
  max_participants: number;
  current_participants: number;
  prize_amount?: number;
  prize_description?: string;
  status: string;
  organizer_id: string;
  banner_url?: string;
  is_private?: boolean;
}

export default function DashboardTournamentsPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [unregisterId, setUnregisterId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  // Fetch tournaments created by the user
  const { data: createdTournaments, isLoading: loadingCreated } = useQuery({
    queryKey: ["created-tournaments", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "tournaments"),
        where("organizer_id", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tournament[];
    },
    enabled: !!user,
  });

  // Fetch tournaments the user is participating in
  const { data: joinedTournaments, isLoading: loadingJoined } = useQuery({
    queryKey: ["joined-tournaments", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "tournaments"),
        where("participants", "array-contains", user.uid),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tournament[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "tournaments", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["created-tournaments"] });
      toast.success("Torneio excluído com sucesso!");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir torneio.");
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (id: string) => {
      const tournamentRef = doc(db, "tournaments", id);
      await updateDoc(tournamentRef, {
        participants: arrayRemove(user?.uid),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joined-tournaments"] });
      toast.success("Inscrição cancelada com sucesso!");
      setUnregisterId(null);
    },
    onError: () => {
      toast.error("Erro ao cancelar inscrição.");
    },
  });

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] bg-nebula text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      <SEO title="Meus Torneios - Revallo" />
      <Header />

      <main className="container py-12 mx-auto px-4 relative z-10 max-w-6xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link
              href="/painel"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao Painel
            </Link>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Meus Torneios
            </h1>
          </div>
          <CreateTournamentDialog>
            <Button className="h-12 bg-white text-black hover:bg-gray-200 rounded-none px-8 font-black uppercase italic tracking-widest text-[11px] shadow-xl shadow-white/5">
              <Plus className="h-4 w-4 mr-2" />
              Criar Torneio
            </Button>
          </CreateTournamentDialog>
        </div>

        <Tabs defaultValue="created" className="space-y-8">
          <TabsList className="bg-[#050505] border border-white/5 p-1 rounded-none h-14 w-fit">
            <TabsTrigger 
              value="created" 
              className="px-8 h-full rounded-none data-[state=active]:bg-white/5 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest italic"
            >
              Organizados ({createdTournaments?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="joined" 
              className="px-8 h-full rounded-none data-[state=active]:bg-white/5 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest italic"
            >
              Inscritos ({joinedTournaments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created">
            {loadingCreated ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1,2,3].map(i => <div key={i} className="h-40 bg-white/2 animate-pulse border border-white/5" />)}
              </div>
            ) : createdTournaments && createdTournaments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {createdTournaments.map((t) => (
                  <TournamentManagementCard 
                    key={t.id} 
                    tournament={t} 
                    isOwner={true} 
                    onAction={() => router.push(`/tournaments/${t.id}`)}
                    onDelete={() => setDeleteId(t.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Você ainda não criou torneios" subtitle="Comece sua jornada como organizador agora!" />
            )}
          </TabsContent>

          <TabsContent value="joined">
             {loadingJoined ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1,2,3].map(i => <div key={i} className="h-40 bg-white/2 animate-pulse border border-white/5" />)}
              </div>
            ) : joinedTournaments && joinedTournaments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedTournaments.map((t) => (
                  <TournamentManagementCard 
                    key={t.id} 
                    tournament={t} 
                    isOwner={false} 
                    onAction={() => router.push(`/tournaments/${t.id}`)}
                    onDelete={() => setUnregisterId(t.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma inscrição ativa" subtitle="Explore a lista de torneios e garanta sua vaga!" />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="bg-[#050505] border-white/10 text-white rounded-none p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black italic uppercase tracking-tight text-2xl">
                Excluir Torneio?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 font-medium italic text-xs uppercase tracking-widest mt-2">
                Esta ação é irreversível. O torneio será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8">
              <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0 rounded-none h-12 px-8 font-black uppercase italic tracking-widest text-[10px]">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic rounded-none h-12 px-8 tracking-widest text-[10px]"
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!unregisterId} onOpenChange={() => setUnregisterId(null)}>
          <AlertDialogContent className="bg-[#050505] border-white/10 text-white rounded-none p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black italic uppercase tracking-tight text-2xl">
                Sair do Torneio?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 font-medium italic text-xs uppercase tracking-widest mt-2">
                Sua inscrição será cancelada e sua vaga ficará disponível para outros jogadores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8">
              <AlertDialogCancel className="bg-white/5 hover:bg-white/10 text-white border-0 rounded-none h-12 px-8 font-black uppercase italic tracking-widest text-[10px]">
                Voltar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unregisterId && unregisterMutation.mutate(unregisterId)}
                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase italic rounded-none h-12 px-8 tracking-widest text-[10px]"
              >
                Confirmar Saída
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function TournamentManagementCard({ tournament, isOwner, onAction, onDelete }: { 
  tournament: Tournament, 
  isOwner: boolean, 
  onAction: () => void,
  onDelete: () => void
}) {
  return (
    <Card className="bg-[#050505] border-white/5 rounded-none overflow-hidden group hover:bg-white/2 transition-all">
      <div className="h-32 relative overflow-hidden">
        <img 
          src={tournament.banner_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
          alt="" 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
             <Badge className="bg-purple-500 text-black font-black uppercase text-[8px] italic rounded-none px-2 py-0.5 border-0">
               {tournament.status}
             </Badge>
             {tournament.is_private ? (
               <div className="p-1 bg-amber-500/20 border border-amber-500/20">
                 <Lock className="h-3 w-3 text-amber-500" />
               </div>
             ) : (
               <div className="p-1 bg-green-500/20 border border-green-500/20">
                 <Globe className="h-3 w-3 text-green-500" />
               </div>
             )}
        </div>
      </div>
      <CardContent className="p-6">
         <h4 className="text-sm font-black italic uppercase tracking-tight text-white line-clamp-1 mb-1">{tournament.title}</h4>
         <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-4 italic">{tournament.game}</p>
         
         <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
               <Users className="h-3 w-3 text-purple-500" />
               {tournament.current_participants || 0} / {tournament.max_participants}
            </div>
             <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                <Trophy className="h-3 w-3 text-amber-500" />
                {tournament.prize_amount && tournament.prize_amount > 0
                  ? `R$ ${tournament.prize_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : tournament.prize_description || "Sem premiação"}
             </div>
         </div>

         <div className="flex items-center gap-2">
            <Button onClick={onAction} className="flex-1 h-10 bg-white/5 hover:bg-white/10 rounded-none text-[9px] font-black uppercase tracking-widest italic text-white border border-white/10 group-hover:border-white/20 transition-all">
              {isOwner ? "Gerenciar" : "Detalhes"}
              <ChevronRight className="h-3 w-3 ml-2 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </Button>
             <Button onClick={onDelete} variant="ghost" className="h-10 w-10 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-none transition-all">
                <Trash2 className="h-4 w-4" />
             </Button>
         </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="py-20 text-center bg-[#050505] border border-dashed border-white/5 rounded-none">
       <Trophy className="h-12 w-12 text-gray-900 mx-auto mb-4" />
       <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 italic mb-2">{title}</h3>
       <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{subtitle}</p>
    </div>
  )
}
