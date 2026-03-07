"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useTournament, useTournamentParticipants } from "@/hooks/useTournaments";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { 
  Trophy, MessageSquare, Users, Info, 
  ArrowLeft, Send, Hash, Loader2, Flag,
  Megaphone, UserPlus, Settings, Share2,
  Calendar, Coins, Clock, Mic, Image as ImageIcon,
  Trash2, Plus, MoreVertical, MoreHorizontal,
  Shield, ClipboardList, User, GraduationCap,
  Crown, UserCheck, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateChannelDialog } from "@/components/communities/CreateChannelDialog";
import { AudioPlayer } from "@/components/communities/AudioPlayer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { GAME_INFO, STATUS_INFO, TournamentParticipant, GameType, TournamentStatus } from "@/types";
import { useCommunityActions, useChannels } from "@/hooks/useCommunities";
import { useTeams } from "@/hooks/useTeams";
import { uploadAudioToCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { updateDoc, doc, getDoc, getDocs, query, collection, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TournamentHubPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: tournament, isLoading: loadingTournament } = useTournament(id || "");
  const { data: participants } = useTournamentParticipants(id || "");
  const communityId = tournament?.community_id;
  
  const { data: channels, isLoading: loadingChannels } = useChannels(communityId || "");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  const activeChannel = channels?.find(c => c.id === activeChannelId);
  const isOrganizer = user?.uid === tournament?.organizer_id;

  const { inviteMemberByEmail } = useTeams(user?.uid);

  const {
    sendMessage,
    createCommunity,
    createChannel,
    deleteChannel,
  } = useCommunityActions();

  // Find user as participant to check role
  const userParticipant = (participants as any[])?.find(p => p.player_id === user?.uid);
  const isCaptain = userParticipant?.role === 'captain';
  const userTeamName = userParticipant?.team_name;

  const {
    messages,
    loading: loadingChat,
    sendMessage: chatSendMessage,
  } = useChat(
    communityId || "", 
    activeChannelId || "", 
    activeChannel?.type, 
    tournament?.organizer_id
  );

  const canType = activeChannel?.type !== "announcement" || isOrganizer;

  const [message, setMessage] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [inviteRole, setInviteRole] = useState<string>("player");
  const [inviteTeam, setInviteTeam] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [winners, setWinners] = useState<{player_id: string, placement: number, amount: number}[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const initializingRef = useRef(false);

  // Auto-select first channel
  useEffect(() => {
    if (channels && channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !communityId || !activeChannelId) return;

    try {
      await chatSendMessage.mutateAsync({ 
        text: message
      });
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        try {
          const url = await uploadAudioToCloudinary(blob);
          await chatSendMessage.mutateAsync({
            text: "Mensagem de voz",
            // Note: useChat hook might need adjustment if it doesn't support audio directly yet,
            // but for now we follow community pattern.
          });
          // Actually, current useChat only takes text. We'd need to use useCommunityActions.sendMessage
          // but useChat is real-time. Let's use useCommunityActions.sendMessage for media.
          await sendMessage.mutateAsync({
            channelId: activeChannelId!,
            userId: user!.uid,
            content: "Mensagem de voz",
            type: "audio",
            audioUrl: url
          });
        } catch (err) {
          toast.error("Erro ao enviar áudio");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Erro ao acessar microfone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  // Auto-initialize Community if missing (Organizer only)
  useEffect(() => {
    const initCommunity = async () => {
      if (isOrganizer && tournament && !tournament.community_id && !createCommunity.isPending && !initializingRef.current) {
        initializingRef.current = true;
        
        try {
          // 1. Double check on server by tournament_id to prevent duplicate hubs
          const existingHubsQuery = query(
            collection(db, "communities"),
            where("tournament_id", "==", tournament.id),
            limit(1)
          );
          const existingHubsSnap = await getDocs(existingHubsQuery);
          
          if (!existingHubsSnap.empty) {
             const existingId = existingHubsSnap.docs[0].id;
             console.log("Found existing hub:", existingId);
             
             // Update local cache
             queryClient.setQueryData(["tournament", tournament.id], (old: any) => ({
                ...old,
                community_id: existingId
             }));

             // Ensure tournament doc is linked
             await updateDoc(doc(db, "tournaments", tournament.id), {
                community_id: existingId
             });
             
             initializingRef.current = false;
             return;
          }

          // 2. Create the community if really not found
          const newCommunityId = await createCommunity.mutateAsync({
            name: `Hub: ${tournament.title}`,
            description: `Comunidade oficial do torneio ${tournament.title}`,
            game: tournament.game || null,
            userId: user!.uid,
            banner_url: tournament.banner_url || null,
            type: 'tournament',
            tournamentId: tournament.id
          });
          
          // Update local cache immediately
          queryClient.setQueryData(["tournament", tournament.id], (old: any) => ({
            ...old,
            community_id: newCommunityId
          }));

          // Update tournament with new community_id in DB
          await updateDoc(doc(db, "tournaments", tournament.id), {
            community_id: newCommunityId
          });
          
          toast.success("Hub de comunicação inicializado!");
        } catch (err) {
          console.error("Error initializing community:", err);
          initializingRef.current = false;
        }
      }
    };
    initCommunity();
  }, [isOrganizer, tournament?.community_id, createCommunity.isPending, tournament?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannelId) return;

    try {
      const url = await uploadToCloudinary(file);
      await sendMessage.mutateAsync({
        channelId: activeChannelId,
        userId: user!.uid,
        content: url, // Store URL as content for images
        type: "image",
      });
    } catch (err) {
      toast.error("Erro ao enviar imagem");
    }
  };

  // Group participants by team
  const groupedParticipants = (participants as TournamentParticipant[] | undefined)?.reduce((acc: Record<string, TournamentParticipant[]>, p) => {
    const teamName = p.team_name || "Jogadores Individuais";
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(p);
    return acc;
  }, {});

  const getRoleIcon = (role?: string | null) => {
    switch (role) {
      case 'captain': return <Shield className="h-3.5 w-3.5 text-primary" />;
      case 'coach': return <GraduationCap className="h-3.5 w-3.5 text-amber-500" />;
      case 'analista': return <ClipboardList className="h-3.5 w-3.5 text-blue-500" />;
      default: return <User className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const cleanNickname = (nickname: string) => {
    if (!nickname) return "";
    // Strips common patterns: [TAG] Name, TAG | Name, TAG Name
    return nickname.replace(/^\[.*?\]\s*|^.*?\|\s*|^.*?\s-\s*/, '').trim();
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case 'captain': return "Capitão";
      case 'coach': return "Coach";
      case 'analista': return "Analista";
      default: return "Player";
    }
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/5 bg-[#0D0D0F]/50 backdrop-blur-md shrink-0">
        <Link 
          href={`/tournaments/${id}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white mb-6 transition-colors italic"
        >
          <ArrowLeft className="h-3 w-3" />
          Ver Torneio
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black italic uppercase tracking-tighter text-lg truncate leading-tight">
              {tournament?.title}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Hub do Torneio
            </p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic">
                Canais do Hub
              </p>
              {isOrganizer && (
                <button 
                  onClick={() => setShowCreateChannel(true)}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {loadingChannels ? (
                 <div className="flex items-center justify-center p-8">
                   <Loader2 className="h-4 w-4 animate-spin text-primary" />
                 </div>
              ) : (
                channels?.map((channel) => {
                  const isActive = activeChannelId === channel.id;
                  return (
                    <div key={channel.id} className="relative group/channel">
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        className={`w-full group flex items-center gap-4 px-3 py-3 rounded-2xl text-left transition-all ${
                          isActive
                            ? "bg-white/5 text-white"
                            : "text-gray-500 hover:bg-white/2 hover:text-white"
                        }`}
                      >
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-95"
                              : "bg-white/2 group-hover:bg-white/5"
                          }`}
                        >
                          {channel.type === 'announcement' ? (
                              <Megaphone className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-700 group-hover:text-primary"}`} />
                          ) : (
                              <Hash className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-700 group-hover:text-primary"}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black italic uppercase tracking-tighter text-sm truncate">
                            {channel.name}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-700 italic">
                            {channel.type === 'announcement' ? "Anúncios" : "Chat de Texto"}
                          </p>
                        </div>

                        {isOrganizer && channel.name !== "geral" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button onClick={e => e.stopPropagation()} className="opacity-0 group-hover/channel:opacity-100 p-2 text-gray-700 hover:text-white">
                                <MoreVertical size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" className="bg-[#0D0D0F] border-white/5">
                              <DropdownMenuItem 
                                onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                className="text-red-500 font-black italic uppercase text-[10px] tracking-widest"
                              >
                                <Trash2 size={12} className="mr-2" />
                                Excluir Canal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Functional Options Area */}
          <div className="pt-4 border-t border-white/5 space-y-4">
             <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic mb-3 px-3">
              Opções Adicionais
            </p>
            <div className="grid grid-cols-1 gap-2 px-1">
               <Button 
                 variant="ghost" 
                 className="w-full justify-start h-12 rounded-2xl bg-white/2 border border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/5"
                 onClick={() => setShowParticipants(!showParticipants)}
               >
                 <Users className="h-4 w-4 mr-3 text-primary" />
                 Participantes
               </Button>
               <Button 
                 variant="ghost" 
                 className="w-full justify-start h-12 rounded-2xl bg-white/2 border border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/5"
                 onClick={() => {
                    const url = window.location.origin + `/tournaments/${id}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Link do torneio copiado!");
                 }}
               >
                 <Share2 className="h-4 w-4 mr-3 text-blue-500" />
                 Convidar Players
               </Button>
               {isOrganizer && (
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start h-12 rounded-2xl border text-[10px] font-black uppercase italic tracking-widest transition-all ${
                    showManagement 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-white/2 border-white/5 text-primary hover:bg-primary/5"
                  }`}
                  onClick={() => setShowManagement(!showManagement)}
                >
                  <Trophy className="h-4 w-4 mr-3" />
                  Administrar
                </Button>
                )}
               <Link href={`/tournaments/${id}`}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 rounded-2xl bg-white/2 border border-white/5 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/5"
                >
                  <Info className="h-4 w-4 mr-3 text-amber-500" />
                  Regulamento
                </Button>
               </Link>
            </div>
          </div>
      </ScrollArea>
    </>
  );

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!isOrganizer) return;
    if (confirm(`Excluir canal #${channelName}?`)) {
      try {
        await deleteChannel.mutateAsync(channelId);
        toast.success("Canal excluído");
        if (activeChannelId === channelId) setActiveChannelId(null);
      } catch {
        toast.error("Erro ao excluir canal");
      }
    }
  };
  if (loadingTournament) {
    return (
      <div className="h-screen bg-[#0A0A0C] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Sincronizando Hub...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="h-screen bg-[#0A0A0C] flex flex-col items-center justify-center">
        <Trophy className="h-12 w-12 text-gray-800 mb-4" />
        <p className="text-xl font-black italic uppercase text-white">Torneio não encontrado</p>
        <Button onClick={() => router.push("/tournaments")} className="mt-4">Explorar Torneios</Button>
      </div>
    );
  }

  const handleDistributePrizes = async () => {
    if (winners.length === 0) {
      toast.error("Selecione pelo menos um vencedor");
      return;
    }

    // Check for missing PIX keys
    const missingPix = winners.filter(w => {
      const p = participants?.find(participant => participant.player_id === w.player_id);
      return !p?.pix_key;
    });

    if (missingPix.length > 0) {
      const names = missingPix.map(w => {
        const p = participants?.find(participant => participant.player_id === w.player_id);
        return p?.player?.nickname || "Participante";
      }).join(", ");
      
      toast.error(`Impossível finalizar: Os seguintes premiados não possuem chave PIX cadastrada: ${names}.`, {
        duration: 5000
      });
      return;
    }

    setIsDistributing(true);
    try {
      const idToken = await user!.getIdToken();
      const response = await fetch("/api/distribute-tournament-prizes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tournament_id: id,
          winners
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Prêmios distribuídos com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["tournament", id] });
        setShowManagement(false);
      } else {
        toast.error(data.error || "Erro ao distribuir prêmios");
      }
    } catch (err: any) {
      toast.error("Erro na comunicação com o servidor");
    } finally {
      setIsDistributing(false);
    }
  };



  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0A0A0C] text-white">
      <SEO title={`Hub: ${tournament?.title || "Carregando..." } - Revallo`} />
      <Header />
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/2 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Desktop Sidebar: Channels */}
        <aside className="w-72 bg-[#0D0D0F] border-r border-white/5 hidden lg:flex flex-col h-full shrink-0 relative z-10 transition-all duration-500">
          {renderSidebarContent()}
        </aside>

        {/* Mobile Sidebar Trigger & Sheet */}
        <Sheet>
          <div className="lg:hidden fixed bottom-24 right-6 z-50">
            <SheetTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-2xl bg-primary shadow-2xl shadow-primary/40 border border-primary/20">
                <Hash className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="left" className="w-[300px] p-0 bg-[#0D0D0F] border-white/5">
            <div className="h-full flex flex-col">
              {renderSidebarContent()}
            </div>
          </SheetContent>
        </Sheet>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0A0A0C]">
          <header className="h-20 border-b border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
               <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                 {activeChannel?.type === 'announcement' ? <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-primary" /> : <Hash className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
               </div>
               <div className="min-w-0">
                  <h4 className="text-base md:text-xl font-black italic uppercase tracking-tighter text-white truncate">
                    #{activeChannel?.name || "Canal"}
                  </h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 italic truncate">
                    {activeChannel?.type === 'announcement' ? "Restrito • Organização" : "Comunicação"}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
               <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Hub Ativo</span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-700 uppercase">{participants?.length || 0} players</span>
               </div>
               
               {user?.uid === tournament?.organizer_id && (
                  <Link href={`/tournaments/${id}`}>
                    <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 text-[9px] md:text-[10px] h-9 md:h-10 px-4 md:px-6 rounded-xl font-black uppercase tracking-widest italic whitespace-nowrap">
                       Gerenciar
                    </Button>
                  </Link>
               )}
            </div>
          </header>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scrollbar-hide relative z-10"
          >
            {loadingChat ? (
               <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4 text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Sincronizando Mensagens...</p>
               </div>
            ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-[32px] bg-primary/5 border border-dashed border-primary/20 flex items-center justify-center mb-6 md:mb-8">
                    <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-primary/30" />
                  </div>
                  <h4 className="text-xl md:text-2xl font-black italic uppercase text-white mb-2">Canal Silencioso</h4>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Seja o primeiro a deixar sua marca.</p>
                </div>
            ) : (
                messages.map((msg: any) => {
                    const isOwn = msg.user_id === user?.uid;
                    return (
                        <div key={msg.id} className={`flex gap-2 md:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 ${isOwn ? "flex-row-reverse" : ""}`}>
                           <Avatar className={`h-9 w-9 md:h-11 md:w-11 rounded-2xl border shrink-0 ${isOwn ? "border-primary/30" : "border-white/5"}`}>
                             <AvatarImage src={msg.user_photo} />
                             <AvatarFallback className="bg-white/2 text-primary font-black italic text-xs md:text-sm">
                                {msg.user_name?.[0]?.toUpperCase() || "U"}
                             </AvatarFallback>
                           </Avatar>
        
                              <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                                <div className={`flex items-baseline gap-2 md:gap-3 px-1 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                  <span className={`text-[10px] md:text-[11px] font-black italic uppercase tracking-tighter ${isOwn ? "text-primary" : "text-white"}`}>
                                    {msg.user_name}
                                  </span>
                                  {msg.team_name && (
                                    <Badge variant="outline" className="text-[7px] md:text-[8px] h-3.5 md:h-4 bg-white/2 border-white/5 font-black italic uppercase tracking-widest text-gray-500">
                                       {msg.team_name}
                                    </Badge>
                                  )}
                                  <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-700 bg-white/2 px-2 py-0.5 rounded-md italic">
                                     {msg.created_at?.toDate ? format(msg.created_at.toDate(), "HH:mm") : "agora"}
                                  </span>
                                </div>
                                
                                {msg.type === 'audio' ? (
                                  <AudioPlayer src={msg.audio_url!} isOwn={isOwn} />
                                ) : msg.type === 'image' || (msg.content?.startsWith('http') && (msg.content?.includes('cloudinary') || msg.content?.match(/\.(jpeg|jpg|gif|png)$/) )) ? (
                                  <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                    <img src={msg.audio_url || msg.content} alt="Upload" className="max-w-xs max-h-64 object-cover" />
                                  </div>
                                ) : (
                                  <div className={`px-4 md:px-5 py-2.5 md:py-3.5 text-xs md:text-sm font-medium leading-relaxed break-words shadow-2xl ${
                                      isOwn 
                                        ? "bg-primary text-white rounded-[20px] md:rounded-[24px] rounded-tr-sm" 
                                        : "bg-white/5 text-gray-200 rounded-[20px] md:rounded-[24px] rounded-tl-sm border border-white/5"
                                  }`}>
                                    {msg.content}
                                  </div>
                                )}
                              </div>
                        </div>
                    );
                })
            )}
            <div className="h-4" />
          </div>

          <footer className="p-4 md:p-6 bg-[#0D0D0F] border-t border-white/5 relative z-30">
            {/* Hidden Input for Images */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />

            {!user ? (
                <div className="h-14 md:h-16 flex items-center justify-center bg-white/2 border border-dashed border-white/5 rounded-2xl px-4">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-600 italic text-center">
                    ❌ É necessário estar autenticado.
                  </p>
                </div>
            ) : !canType ? (
                <div className="h-14 md:h-16 flex items-center justify-center bg-white/2 border border-dashed border-white/5 rounded-2xl px-4">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-600 italic text-center">
                    ❌ Somente a organização pode enviar mensagens aqui.
                  </p>
                </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2 md:gap-3 max-w-5xl mx-auto">
                <div className="flex-1 relative">
                  <Input
                    placeholder={isRecording ? "Gravando voz..." : `Sua mensagem em #${activeChannel?.name || "..."}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isRecording}
                    className="w-full h-12 md:h-14 bg-white/5 border border-white/10 rounded-[18px] md:rounded-[22px] px-4 md:px-6 pr-12 md:pr-14 text-xs md:text-sm font-medium focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-gray-700 placeholder:italic placeholder:font-black placeholder:uppercase placeholder:text-[9px] md:placeholder:text-[10px] placeholder:tracking-widest"
                  />
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5">
                    {!isRecording && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 w-9 md:h-11 md:w-11 flex items-center justify-center text-gray-700 hover:text-white transition-all bg-white/5 rounded-xl md:rounded-2xl border border-white/5"
                      >
                        <ImageIcon size={16} />
                      </button>
                    )}
                    <Button
                      type="submit"
                      disabled={!message.trim() || chatSendMessage.isPending || isRecording}
                      className="h-9 w-9 md:h-11 md:w-11 p-0 bg-primary hover:opacity-90 rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                    >
                      {chatSendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Mic Control */}
                {isRecording ? (
                   <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                       <button
                        type="button"
                        onClick={stopRecording}
                        className="h-12 md:h-14 px-4 md:px-6 bg-primary text-white font-black italic uppercase text-[9px] md:text-[10px] rounded-[18px] md:rounded-[22px] flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                         <Send size={14} className="md:size-4" /> Enviar
                       </button>
                    </div>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="h-12 w-12 md:h-14 md:w-14 bg-white/5 border border-white/5 rounded-[18px] md:rounded-[22px] flex items-center justify-center text-gray-700 hover:text-primary transition-all active:scale-95"
                  >
                    <Mic size={18} className="md:size-5" />
                  </button>
                )}
              </form>
            )}
          </footer>
        </main>

        {/* Info/Participants Side Panel (Conditional) */}
        {showParticipants && (
           <aside className="w-80 border-l border-white/5 bg-[#0D0D0F] flex flex-col h-full shrink-0 animate-in slide-in-from-right-2 relative z-40 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <header className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                 <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                   Lineups <span className="text-primary italic">Ativos</span>
                 </h3>
                 <button onClick={() => setShowParticipants(false)} className="text-gray-600 hover:text-white transition-colors">
                   <ArrowLeft className="h-5 w-5 rotate-180" />
                 </button>
              </header>
              <ScrollArea className="flex-1 p-6">
                 <div className="space-y-8">
                     {Object.entries(groupedParticipants || {}).map(([teamName, members]) => (
                       <div key={teamName} className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic flex items-center gap-2">
                                <Shield className="h-3 w-3 text-primary" /> {teamName}
                             </h4>
                             <Badge className="bg-white/5 border-white/5 text-[8px] h-4 font-black italic">{members.length} players</Badge>
                          </div>
                          <div className="space-y-2">
                              {members
                                .sort((a, b) => (a.role === 'captain' ? -1 : b.role === 'captain' ? 1 : 0))
                                .map((p) => (
                                 <Link 
                                   key={p.id} 
                                   href={`/profile/${p.player_id || "not-found"}`}
                                   className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group"
                                 >
                                    <Avatar className="h-9 w-9 border border-white/10 group-hover:border-primary/50 transition-all">
                                       <AvatarImage src={p.player?.avatar_url ?? undefined} />
                                       <AvatarFallback className="bg-white/2 text-gray-500 font-black italic text-[10px]">
                                          {p.player?.nickname?.charAt(0) || "P"}
                                       </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                         <p className="font-black italic uppercase tracking-tighter text-white text-xs truncate leading-tight">
                                            {cleanNickname(p.player?.nickname || "Jogador")}
                                         </p>
                                         {getRoleIcon(p.role)}
                                       </div>
                                       <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`text-[8px] font-black uppercase tracking-widest italic px-1.5 py-0.5 rounded ${
                                            p.role === 'captain' ? 'bg-primary/20 text-primary' : 
                                            p.role === 'coach' ? 'bg-amber-500/20 text-amber-500' :
                                            p.role === 'analista' ? 'bg-blue-500/20 text-blue-500' :
                                            'bg-white/5 text-gray-700'
                                          }`}>
                                            {getRoleLabel(p.role)}
                                          </span>
                                       </div>
                                    </div>
                                 </Link>
                              ))}
                          </div>
                       </div>
                    ))}
                    {(!participants || participants.length === 0) && (
                       <div className="py-20 text-center opacity-20">
                          <Users className="h-12 w-12 mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase italic tracking-widest">Nenhuma lineup inscrita</p>
                       </div>
                    )}
                 </div>
              </ScrollArea>
              
               {isOrganizer && (
                  <div className="p-4 border-t border-white/5 bg-secondary/5 space-y-4">
                     <div className="px-1 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-widest text-secondary italic">Convites da Organização</p>
                        <UserPlus className="h-3 w-3 text-secondary" />
                     </div>
                     
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                           {['player', 'coach', 'analista'].map((role) => (
                              <button
                                key={role}
                                onClick={() => setInviteRole(role)}
                                className={`h-8 rounded-lg text-[8px] font-black uppercase italic border transition-all ${
                                  inviteRole === role 
                                    ? "bg-secondary border-secondary text-black" 
                                    : "bg-white/2 border-white/5 text-gray-500"
                                }`}
                              >
                                {role}
                              </button>
                           ))}
                        </div>
                        <Input 
                          placeholder="Email do Player"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="h-9 bg-white/2 border-white/5 text-[10px] font-bold italic placeholder:text-gray-700"
                        />
                        <Input 
                          placeholder="Equipe (Opcional)"
                          value={inviteTeam}
                          onChange={(e) => setInviteTeam(e.target.value)}
                          className="h-9 bg-white/2 border-white/5 text-[10px] font-bold italic placeholder:text-gray-700 uppercase"
                        />
                        <div className="grid grid-cols-2 gap-2">
                           <Button 
                              onClick={async () => {
                                 if (!inviteEmail) return toast.error("Informe o e-mail");
                                 try {
                                    // Organizers might not have a teamId, but here they are likely inviting to the tournament
                                    // In our schema, we can use a dummy teamId if needed or update useTeams
                                    // But actually, the user wants the notification to arrive.
                                    // We can use a tournament_wide_team or similar.
                                    // Let's assume for now they are inviting to the general tournament.
                                    await inviteMemberByEmail.mutateAsync({
                                       teamId: "TOURNAMENT_INVITE", // Sentinel value
                                       email: inviteEmail,
                                       role: inviteRole,
                                       tournamentId: id,
                                       tournamentTitle: tournament.title,
                                       senderNickname: user?.nickname || "Organização"
                                    });
                                    setInviteEmail("");
                                    toast.success("Convite enviado com sucesso!");
                                 } catch (err: any) {
                                    toast.error(err.message);
                                 }
                              }}
                              className="h-9 bg-primary text-white hover:opacity-90 font-black uppercase italic tracking-widest text-[9px] rounded-lg"
                           >
                              {inviteMemberByEmail.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Enviar Convite"}
                           </Button>
                           <Button 
                              variant="outline"
                              onClick={() => {
                                 const baseUrl = window.location.origin + `/tournaments/${id}`;
                                 const inviteUrl = `${baseUrl}?join=true&role=${inviteRole}${inviteTeam ? `&team=${encodeURIComponent(inviteTeam)}` : ''}`;
                                 navigator.clipboard.writeText(inviteUrl);
                                 toast.success(`Link de ${inviteRole} copiado!`);
                              }}
                              className="h-9 border-white/10 text-gray-400 text-[9px] font-black uppercase italic tracking-widest rounded-lg"
                           >
                              Copiar Link
                           </Button>
                        </div>
                     </div>
                  </div>
               )}

               {isOrganizer && (
                  <div className="p-4 border-t border-white/5 bg-black/20">
                     <Button 
                       onClick={() => router.push(`/tournaments/${id}/manage`)}
                       className="w-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all font-black italic uppercase text-[10px] rounded-xl h-12"
                     >
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        Gerenciar Torneio
                     </Button>
                  </div>
               )}

               {isCaptain && userTeamName && (
                  <div className="p-4 border-t border-white/5 bg-primary/5">
                     <div className="mb-3 px-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary italic">Painel do Capitão</p>
                        <p className="text-[11px] font-black italic uppercase text-white truncate">{userTeamName}</p>
                     </div>
                     <Button 
                       onClick={() => {
                          const inviteUrl = window.location.origin + `/tournaments/${id}/join?team=${encodeURIComponent(userTeamName)}`;
                          navigator.clipboard.writeText(inviteUrl);
                          toast.success("Link de convite do time copiado!");
                       }}
                       className="w-full bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-black transition-all font-black italic uppercase text-[10px] rounded-xl h-12"
                     >
                        <UserPlus className="h-3.5 w-3.5 mr-2" />
                        Convidar para o Time
                     </Button>
                  </div>
               )}
            </aside>
        )}
      </div>

      <CreateChannelDialog
        communityId={communityId || ""}
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
      />

      {/* Global Finalized Banner */}
      {tournament.status === 'completed' && (
        <div className="fixed top-20 left-0 right-0 z-50 px-8 pointer-events-none">
           <div className="max-w-4xl mx-auto bg-amber-500 text-black p-4 rounded-2xl shadow-2xl flex items-center justify-between border-4 border-black animate-bounce pointer-events-auto">
              <div className="flex items-center gap-4">
                 <Trophy size={32} className="shrink-0" />
                 <div>
                    <h2 className="font-black italic uppercase text-xl leading-none">Torneio Finalizado</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Os prêmios foram distribuídos conforme os resultados oficiais.</p>
                 </div>
              </div>
              <Button size="sm" variant="ghost" className="text-black hover:bg-black/10 font-black italic uppercase tracking-widest">Ver Resultados</Button>
           </div>
        </div>
      )}

      {/* Management Overlay Panel */}
      {showManagement && isOrganizer && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-[#0D0D0F] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[100] animate-in slide-in-from-right duration-500 flex flex-col pt-20">
           <header className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                 <Badge className="bg-primary/20 text-primary border-primary/20 font-black italic uppercase text-[10px]">Organizer Tools</Badge>
                 <button onClick={() => setShowManagement(false)} className="text-gray-500 hover:text-white"><ArrowLeft size={18} className="rotate-180" /></button>
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Administrar <span className="text-primary italic">Torneio</span></h2>
           </header>

           <ScrollArea className="flex-1 p-8">
              <div className="space-y-8">
                  <section>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-4">Configuração de Premiação</h3>
                     <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
                           <span className="text-gray-500">Prêmio Total do Torneio:</span>
                           <span className="text-white">R$ {(tournament.prize_pool_total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase italic pt-2 border-t border-white/5">
                           <span className="text-gray-500">Total a Distribuir Agora:</span>
                           <span className={`${
                             winners.reduce((acc, curr) => acc + curr.amount, 0) > (tournament.prize_pool_total || 0) + 0.01 
                             ? "text-red-500" 
                             : "text-primary"
                           } font-black`}>
                             R$ {winners.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                           </span>
                        </div>
                        
                        {winners.reduce((acc, curr) => acc + curr.amount, 0) > (tournament.prize_pool_total || 0) + 0.01 && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                             <Flag size={14} className="text-red-500 shrink-0" />
                             <p className="text-[9px] font-black uppercase italic text-red-500 leading-tight">
                               Atenção: O total distribuído excede o fundo de prêmios do torneio.
                             </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] font-black uppercase italic pt-2 border-t border-white/5">
                           <span className="text-gray-500">Status do Torneio:</span>
                           <span className={tournament.status === 'completed' ? "text-green-500" : "text-amber-500"}>{tournament.status?.toUpperCase()}</span>
                        </div>
                     </div>
                  </section>

                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic mb-4">Definir Vencedores</h3>
                    <div className="space-y-4">
                       {[1, 2, 3].map((place) => {
                          const winner = winners.find(w => w.placement === place);
                          const participant = participants?.find(p => p.player_id === winner?.player_id);
                          
                          return (
                             <div key={place} className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black italic ${
                                         place === 1 ? "bg-amber-500 text-black" : 
                                         place === 2 ? "bg-gray-400 text-black" : 
                                         "bg-amber-800 text-white"
                                      }`}>
                                         {place}º
                                      </div>
                                      <span className="text-[10px] font-black uppercase italic tracking-widest text-white">Lugar</span>
                                   </div>
                                </div>

                                <div className="flex gap-2">
                                   <select 
                                      className="flex-1 h-10 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase px-4 italic outline-none focus:border-primary/50 transition-all cursor-pointer"
                                      value={winner?.player_id || ""}
                                      onChange={(e) => {
                                         const playerId = e.target.value;
                                         setWinners(prev => {
                                            const rest = prev.filter(w => w.placement !== place);
                                            if (!playerId) return rest;
                                            return [...rest, { player_id: playerId, placement: place, amount: winner?.amount || 0 }];
                                         });
                                      }}
                                   >
                                      <option value="">Selecionar Participante...</option>
                                      {participants?.map((p: any) => (
                                         <option key={p.id} value={p.player_id}>
                                            {p.team_name ? `[${p.team_name}] ${p.player?.nickname}` : p.player?.nickname}
                                         </option>
                                      ))}
                                   </select>
                                   <div className="w-24 relative">
                                      <Input 
                                         type="number"
                                         placeholder="R$"
                                         value={winner?.amount || ""}
                                         onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setWinners(prev => prev.map(w => w.placement === place ? { ...w, amount: val || 0 } : w));
                                         }}
                                         className="h-10 bg-black/40 border border-white/5 rounded-xl text-[10px] font-black uppercase px-4 italic outline-none focus:border-primary/50 transition-all"
                                      />
                                   </div>
                                </div>

                                {participant && (
                                   <div className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5">
                                      <Shield size={12} className="text-primary shrink-0" />
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[8px] font-black text-gray-600 uppercase italic tracking-widest mb-0.5">Chave PIX do Capitão</p>
                                         <p className="text-[10px] font-black text-white italic truncate uppercase">{participant.pix_key || "NÃO CADASTRADA"}</p>
                                      </div>
                                      <Badge variant="outline" className="text-[8px] border-white/10 uppercase italic">{participant.pix_key_type || "N/A"}</Badge>
                                   </div>
                                )}
                             </div>
                          );
                       })}
                    </div>
                 </section>
              </div>
           </ScrollArea>

           <footer className="p-8 border-t border-white/5 bg-black/40">
              <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <Button 
                       disabled={isDistributing || winners.length === 0 || tournament.status === 'completed'}
                       className="w-full h-16 bg-primary text-black hover:opacity-90 font-black italic uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-primary/20 group"
                    >
                       {isDistributing ? (
                          <Loader2 size={18} className="animate-spin" />
                       ) : (
                          <>
                             <CheckCircle size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                             Finalizar & Pagar Prêmios
                          </>
                       )}
                    </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-[#0D0D0F] border-white/10">
                    <AlertDialogHeader>
                       <AlertDialogTitle className="text-xl font-black italic uppercase text-white">Confirmar Finalização?</AlertDialogTitle>
                       <AlertDialogDescription className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                          Você está prestes a finalizar o torneio e distribuir <span className="text-primary text-sm font-black italic">R$ {winners.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</span> em prêmios. 
                          <br/><br/>
                          Esta ação é irreversível e os pagamentos serão processados via Pix para os capitães selecionados.
                       </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                       <AlertDialogCancel className="bg-white/5 border-white/5 text-white hover:bg-white/10 font-black italic uppercase text-[10px] h-10 px-6 rounded-xl">Cancelar</AlertDialogCancel>
                       <AlertDialogAction 
                          onClick={handleDistributePrizes}
                          className="bg-primary text-black hover:opacity-90 font-black italic uppercase text-[10px] h-10 px-6 rounded-xl"
                       >
                          Confirmar & Pagar
                       </AlertDialogAction>
                    </AlertDialogFooter>
                 </AlertDialogContent>
              </AlertDialog>
              <p className="text-[8px] font-black uppercase text-gray-700 italic text-center mt-4 tracking-widest leading-relaxed">
                 * Os pagamentos serão processados via Mercado Pago para as chaves registradas.<br/>
                 O torneio será marcado como "Finalizado" permanentemente.
              </p>
           </footer>
        </div>
      )}
    </div>
  );
}
