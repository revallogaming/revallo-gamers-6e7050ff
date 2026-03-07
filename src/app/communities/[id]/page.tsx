"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCommunity,
  useChannels,
  useMessages,
  useCommunityActions,
  useCommunityMembers,
  useMemberCount,
} from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { EditCommunityDialog } from "@/components/communities/EditCommunityDialog";
import { CreateChannelDialog } from "@/components/communities/CreateChannelDialog";
import { InviteDialog } from "@/components/communities/InviteDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { AudioPlayer } from "@/components/communities/AudioPlayer";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Send,
  Users,
  ArrowLeft,
  Hash,
  Shield,
  Crown,
  ChevronRight,
  MessageSquare,
  Settings,
  Plus,
  Megaphone,
  Mic,
  X,
  Volume2,
  MoreVertical,
  QrCode,
  Flag,
  Trash2,
  Clock,
  UserPlus,
  Ban,
  MoreHorizontal,
  Pencil,
  Bell,
  BellOff,
  User,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommunityMember, TournamentParticipant } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { uploadAudioToCloudinary } from "@/lib/cloudinary";
import { filterContent } from "@/lib/safety";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CommunityDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const { data: community, isLoading: loadingCommunity } = useCommunity(id);
  const { data: channels, isLoading: loadingChannels } = useChannels(id);
  const { data: members } = useCommunityMembers(id);
  const { data: memberCount } = useMemberCount(id);

  const isOwner = community?.owner_id === user?.uid;
  const currentMember = members?.find(m => m.user_id === user?.uid);
  const isMember = isOwner || !!currentMember;
  const isModerator = isOwner || currentMember?.role === "moderator";
  const isMuted = currentMember?.muted === true;

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: loadingMessages } = useMessages(selectedChannelId || "", user?.uid);

  const currentChannel = channels?.find((c) => c.id === selectedChannelId);
  const canType = !isMuted && (isOwner || currentChannel?.type !== "announcement");

  // Auto-select first channel
  useEffect(() => {
    if (channels && channels.length > 0) {
      if (!selectedChannelId || !channels.find(c => c.id === selectedChannelId)) {
        setSelectedChannelId(channels[0].id);
      }
    }
  }, [channels, selectedChannelId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [showHubLeaveDialog, setShowHubLeaveDialog] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const { 
    sendMessage, 
    joinCommunity, 
    leaveCommunity, 
    createChannel, 
    deleteChannel, 
    kickMember, 
    updateMemberRole, 
    muteMember, 
    deleteCommunity, 
    clearChannelMessages,
    deleteMessageForMe,
    toggleTemporaryMessages,
    updateChannel,
    updateMemberNotificationSettings,
  } = useCommunityActions();

  const renderSidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/5 bg-black/10 backdrop-blur-md shrink-0">
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white mb-6 transition-colors italic"
        >
          <ArrowLeft className="h-3 w-3" />
          Explorar Hubs
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-[20px] bg-primary/10 border border-primary/20 flex items-center justify-center font-black italic text-primary text-xl shrink-0 shadow-lg shadow-primary/5">
            {community?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black italic uppercase tracking-tighter text-white truncate">
              {community?.name}
            </h2>
            <div className="flex flex-col gap-2 mt-4">
              {isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleJoinLeave}
                  className="w-full h-8 bg-red-500/5 border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                >
                  Sair do Hub
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleJoinLeave}
                  className="w-full h-8 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Entrar no Hub
                </Button>
              )}

              {isOwner && (
                <EditCommunityDialog community={community!}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 bg-white/2 border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-primary transition-all group/btn"
                  >
                    <Settings className="h-3 w-3.5 mr-2 text-gray-500 group-hover/btn:text-primary" />
                    Configurações
                  </Button>
                </EditCommunityDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] italic">
                Canais do Hub
              </p>
              {isOwner && (
                <button 
                  onClick={() => setShowCreateChannel(true)}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {channels?.map((channel) => {
                const isActive = selectedChannelId === channel.id;
                const isAnnouncement = channel.type === "announcement";
                return (
                  <div key={channel.id} className="relative group/channel">
                    <button
                      onClick={() => {
                        setSelectedChannelId(channel.id);
                      }}
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
                        {isAnnouncement ? (
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
                          {isActive ? "Sessão Ativa" : isAnnouncement ? "Anúncios" : "Chat de Texto"}
                        </p>
                      </div>

                      {isMember && channel.name !== "geral" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className={`p-2 text-gray-700 hover:text-white transition-all ${isActive ? "opacity-100" : "opacity-0 group-hover/channel:opacity-100"}`}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0D0B1A] border-white/10 text-white rounded-xl min-w-[160px]">
                            <DropdownMenuItem 
                              onClick={() => handleToggleTempMessages(channel.id, !!channel.is_temporary)}
                              className="text-[10px] font-black uppercase tracking-widest italic gap-2 focus:bg-white/5 focus:text-white cursor-pointer py-2.5"
                            >
                              <Clock size={12} className={channel.is_temporary ? "text-primary" : "text-gray-500"} />
                              {channel.is_temporary ? "Desativar Temp." : "Mensagens Temp."}
                            </DropdownMenuItem>
                            
                            {isOwner && (
                              <DropdownMenuItem 
                                onClick={() => handleToggleAnnouncement(channel.id, channel.type)}
                                className="text-[10px] font-black uppercase tracking-widest italic gap-2 focus:bg-white/5 focus:text-white cursor-pointer py-2.5"
                              >
                                <Shield size={12} className={channel.type === "announcement" ? "text-primary" : "text-gray-500"} />
                                {channel.type === "announcement" ? "Permitir Mensagens" : "Somente Admins"}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem 
                              onClick={() => handleClearChat(channel.id, channel.name)}
                              className="text-[10px] font-black uppercase tracking-widest italic gap-2 focus:bg-red-500/10 focus:text-red-500 text-red-400 cursor-pointer py-2.5"
                            >
                              <Trash2 size={12} />
                              {isModerator ? "Limpar Canal" : "Limpar para mim"}
                            </DropdownMenuItem>

                            {isModerator && (
                              <>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                  className="text-[10px] font-black uppercase tracking-widest italic gap-2 focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer py-2.5"
                                >
                                  <X size={12} />
                                  Excluir Canal
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 border border-white/5">
          <Avatar className="h-9 w-9 border border-white/10 shrink-0">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-black italic">
              {user?.displayName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase italic tracking-tighter truncate text-white">
              {user?.displayName || "Player"}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 italic">
                Hub Ativo
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const handleJoinLeave = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (isOwner) {
      setShowHubLeaveDialog(true);
      return;
    }

    try {
      if (isMember) {
        if (confirm("Deseja realmente sair desta comunidade?")) {
          await leaveCommunity.mutateAsync({ communityId: id, userId: user.uid });
          toast.success("Você saiu da comunidade.");
        }
      } else {
        await joinCommunity.mutateAsync({ communityId: id, userId: user.uid });
        toast.success("Bem-vindo ao hub!");
      }
    } catch {
      toast.error("Erro ao processar solicitação");
    }
  };

  const handleToggleTempMessages = async (channelId: string, currentStatus: boolean) => {
    try {
      await toggleTemporaryMessages.mutateAsync({ channelId, enabled: !currentStatus });
      toast.success(!currentStatus ? "Mensagens temporárias ativadas (24h)" : "Mensagens temporárias desativadas");
    } catch {
      toast.error("Erro ao alterar configurações do canal");
    }
  };

  const handleDeleteMessageForMe = async (messageId: string) => {
    if (!user) return;
    try {
      await deleteMessageForMe.mutateAsync({ messageId, userId: user.uid });
      toast.info("Mensagem removida para você");
    } catch {
      toast.error("Erro ao remover mensagem");
    }
  };

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (confirm(`Excluir canal #${channelName}?`)) {
      try {
        await deleteChannel.mutateAsync(channelId);
        toast.success("Canal excluído");
      } catch {
        toast.error("Erro ao excluir canal");
      }
    }
  };

  const handleDeleteCommunity = async () => {
    if (!isOwner) return;
    if (confirm(`⚠️ Excluir "${community?.name}" permanentemente? Isso não pode ser desfeito.`)) {
      try {
        await deleteCommunity.mutateAsync(id);
        toast.success("Comunidade excluída!");
        router.push("/communities");
      } catch {
        toast.error("Erro ao excluir comunidade");
      }
    }
  };

  const handleKick = async (userId: string, nickname: string) => {
    if (!isModerator) return;
    if (confirm(`Expulsar ${nickname} do hub?`)) {
      try {
        await kickMember.mutateAsync({ communityId: id, userId });
        toast.success(`${nickname} foi removido.`);
      } catch {
        toast.error("Erro ao expulsar membro");
      }
    }
  };

  const handleBan = async (userId: string, nickname: string) => {
    if (!isOwner) return;
    if (confirm(`⚠️ Banir ${nickname} PERMANENTEMENTE? Este usuário não poderá voltar ao hub.`)) {
      try {
        await kickMember.mutateAsync({ communityId: id, userId });
        toast.success(`${nickname} foi banido permanentemente.`);
      } catch {
        toast.error("Erro ao banir membro");
      }
    }
  };

  const handlePromote = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "moderator" ? "member" : "moderator";
    try {
      await updateMemberRole.mutateAsync({ communityId: id, userId, role: newRole });
      toast.success(newRole === "moderator" ? "Promovido a Moderador!" : "Rebaixado a Membro.");
    } catch {
      toast.error("Erro ao alterar função");
    }
  };

  const handleMute = async (userId: string, muted: boolean) => {
    try {
      await muteMember.mutateAsync({ communityId: id, userId, muted: !muted });
      toast.success(!muted ? "Membro mutado." : "Membro desmutado.");
    } catch {
      toast.error("Erro ao mutar membro");
    }
  };

  const handleClearChat = async (channelId: string, channelName: string) => {
    if (!isModerator) return;
    if (confirm(`⚠️ Limpar TODAS as mensagens de #${channelName}?`)) {
      try {
        await clearChannelMessages.mutateAsync(channelId);
        toast.success("Canal limpo com sucesso!");
      } catch {
        toast.error("Erro ao limpar mensagens");
      }
    }
  };

  const handleToggleNotifications = async () => {
    if (!user || !id) return;
    const isCurrentlyEnabled = !!currentMember?.notifications_enabled;
    const newStatus = !isCurrentlyEnabled;

    if (newStatus && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }
    }

    try {
      await updateMemberNotificationSettings.mutateAsync({ 
        communityId: id, 
        userId: user.uid, 
        enabled: newStatus 
      });
      toast.success(newStatus ? "Notificações ativadas!" : "Notificações desativadas.");
      
      if (newStatus) {
        new Notification("Notificações Ativas", {
          body: `Você receberá alertas de novas mensagens em ${community?.name}.`,
          icon: "/logo.png"
        });
      }
    } catch {
      toast.error("Erro ao alterar configurações de notificação");
    }
  };

  const handleToggleAnnouncement = async (channelId: string, currentType: string) => {
    if (!isOwner) return;
    const newType = currentType === "announcement" ? "text" : "announcement";
    try {
      await updateChannel.mutateAsync({ channelId, type: newType });
      toast.success(newType === "announcement" ? "Canal agora é Somente Admins" : "Canal agora é Comunitário");
    } catch {
      toast.error("Erro ao alterar tipo do canal");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannelId || !user) return;

    const { cleanText, isValid, error } = filterContent(messageText);
    if (!isValid) {
      toast.error(error);
      return;
    }

    if (error) toast.info(error);

    let expiresAt = null;
    if (currentChannel?.is_temporary) {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      expiresAt = tomorrow.toISOString();
    }

    try {
      await sendMessage.mutateAsync({
        channelId: selectedChannelId,
        userId: user.uid,
        content: cleanText.trim(),
        type: "text",
        expiresAt
      });
      setMessageText("");
    } catch {
      toast.error("Erro ao enviar mensagem");
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
        const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
        
        try {
          const url = await uploadAudioToCloudinary(blob);

          let expiresAt = null;
          if (currentChannel?.is_temporary) {
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 24);
            expiresAt = tomorrow.toISOString();
          }

          await sendMessage.mutateAsync({
            channelId: selectedChannelId!,
            userId: user!.uid,
            content: "Mensagem de voz",
            type: "audio",
            audioUrl: url,
            expiresAt
          });
          toast.success("Áudio enviado!");
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

  if (loadingCommunity || loadingChannels) {
    return (
      <div className="h-screen bg-[#0A0A0C] flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <svg
            className="animate-spin h-10 w-10 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent text-white flex flex-col overflow-hidden">
      <SEO title={`${community?.name} - Hub Revallo`} />
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/2 cursor-default blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Desktop Sidebar */}
        <aside className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/5 hidden lg:flex flex-col shrink-0 relative z-10 transition-all duration-500">
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

        <main className="flex-1 flex flex-col bg-transparent min-w-0 relative z-20">
          <header className="h-20 border-b border-white/5 flex items-center px-4 md:px-8 justify-between bg-black/20 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                {currentChannel?.type === 'announcement' ? <Megaphone className="h-5 w-5 text-primary" /> : <Hash className="h-5 w-5 text-primary" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-black italic uppercase tracking-tighter text-white truncate">
                  {currentChannel?.name || "Hub Principal"}
                </h3>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 italic truncate">
                  {currentChannel?.type === 'announcement' ? 'Somente Admins' : 'Comunitário'}
                  {currentChannel?.is_temporary && <span className="text-primary ml-2">• Temp (24h)</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button 
                onClick={handleToggleNotifications}
                className={`h-9 w-9 md:h-10 md:w-10 flex items-center justify-center border rounded-xl transition-all ${currentMember?.notifications_enabled ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/2 border-white/5 text-gray-600 hover:text-white"}`}
                title={currentMember?.notifications_enabled ? "Desativar" : "Ativar"}
              >
                {currentMember?.notifications_enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>

              <button 
                onClick={() => setShowInvite(true)}
                className="hidden sm:flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 md:px-4 h-9 md:h-10 rounded-xl hover:bg-primary/20 transition-all"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest italic text-primary">
                  Convidar
                </span>
              </button>

              <button 
                onClick={() => setShowReport(true)}
                className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center bg-white/2 border border-white/5 rounded-xl hover:bg-white/5 transition-all"
                title="Denunciar Hub"
              >
                <Flag className="h-4 w-4 text-gray-600" />
              </button>

              <button onClick={() => setShowMembers(true)} className="flex items-center gap-2 md:gap-3 bg-white/2 border border-white/5 px-3 md:px-4 h-9 md:h-10 rounded-xl">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="hidden xs:inline text-[9px] md:text-[10px] font-black uppercase tracking-widest italic text-gray-500">
                  {memberCount ?? (members?.length) ?? (community?.member_count || 0)}
                </span>
              </button>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              {loadingMessages ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex gap-4 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                      <Skeleton className="h-10 w-10 rounded-2xl bg-white/5" />
                      <Skeleton className={`h-12 rounded-[24px] bg-white/5 ${i % 2 === 0 ? "w-[60%]" : "w-[40%]"}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-24 w-24 rounded-[32px] bg-primary/5 border border-dashed border-primary/20 flex items-center justify-center mb-8">
                    <Hash className="h-10 w-10 text-primary/30" />
                  </div>
                  <h4 className="text-2xl font-black italic uppercase text-white mb-2">Canal Silencioso</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Seja o primeiro a deixar sua marca.</p>
                </div>
              ) : (
                (() => {
                  const grouped: Array<{ userId: string; msgs: typeof messages }> = [];
                  messages.forEach((msg) => {
                    const last = grouped[grouped.length - 1];
                    if (last && last.userId === msg.user_id) last.msgs.push(msg);
                    else grouped.push({ userId: msg.user_id, msgs: [msg] });
                  });

                  return (
                    <div className="space-y-10">
                      {grouped.map((group, gi) => {
                        const isOwn = group.userId === user?.uid;
                        const firstMsg = group.msgs[0];
                        return (
                          <div key={gi} className={`flex gap-4 ${isOwn ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                            <Avatar className={`h-11 w-11 rounded-2xl border shrink-0 ${isOwn ? "border-primary/30" : "border-white/5"}`}>
                              <AvatarImage src={firstMsg.user?.avatar_url || undefined} />
                              <AvatarFallback className="bg-white/2 text-gray-400 font-black italic text-sm">{firstMsg.user?.nickname?.charAt(0) || "P"}</AvatarFallback>
                            </Avatar>

                            <div className={`flex flex-col gap-1.5 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                                <div className={`flex items-center gap-3 px-1 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                                    <span className={`text-[11px] font-black italic uppercase tracking-tighter ${isOwn ? "text-primary" : "text-white"}`}>
                                    {firstMsg.user?.nickname || "Unknown Player"}
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-gray-700 bg-white/2 px-2 py-0.5 rounded-md italic">
                                    {format(new Date(firstMsg.created_at), "HH:mm")}
                                    </span>
                                </div>
                                <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
                                    {group.msgs.map((msg) => (
                                        <div key={msg.id} className={`relative p-0 overflow-hidden`}>
                                            {msg.type === 'audio' ? (
                                                <AudioPlayer src={msg.audio_url!} isOwn={isOwn} />
                                            ) : (
                                                <div className={`px-5 py-3.5 text-sm font-medium leading-relaxed break-words rounded-[24px] ${
                                                    isOwn ? "bg-primary text-white rounded-tr-sm" : "bg-white/5 text-gray-200 rounded-tl-sm"
                                                } relative group/msg`}>
                                                    {msg.content}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className={`absolute top-2 ${isOwn ? "-left-10" : "-right-10"} p-1 text-gray-700 hover:text-white opacity-0 group-hover/msg:opacity-100 transition-all`}>
                                                                <MoreHorizontal size={14} />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align={isOwn ? "end" : "start"} className="bg-[#0D0B1A] border-white/10 text-white rounded-xl">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteMessageForMe(msg.id)}
                                                                className="text-[10px] font-black uppercase tracking-widest italic gap-2 focus:bg-white/5 focus:text-white cursor-pointer py-2"
                                                            >
                                                                <Trash2 size={12} className="text-red-500" />
                                                                Apagar para mim
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </ScrollArea>

          <footer className="p-6 bg-[#0D0D0F] border-t border-white/5 relative z-30">
            {!user ? (
              <div className="h-16 flex items-center justify-center bg-white/2 border border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">É necessário estar autenticado para interagir.</p>
              </div>
            ) : (!isMember) ? (
              <div className="h-16 flex items-center justify-center bg-primary/5 border border-dashed border-primary/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                  <Shield size={14} /> Você precisa entrar no Hub para participar do chat.
                </p>
              </div>
            ) : !canType ? (
              <div className="h-16 flex items-center justify-center bg-white/1 border border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic flex items-center gap-2">
                  <Shield size={14} className="text-primary" /> Somente administradores podem enviar mensagens neste canal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-3 max-w-5xl mx-auto">
                <div className="flex-1 relative">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isRecording ? "Gravando voz..." : `Sua mensagem em #${currentChannel?.name || "..."}`}
                    className="bg-white/5 border-white/5 h-14 pr-12 rounded-[22px] focus-visible:ring-primary/40 text-sm"
                    disabled={isRecording}
                  />
                  {!isRecording && (
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                        messageText.trim() ? "bg-primary text-white shadow-lg" : "text-gray-700"
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  )}
                </div>

                {isRecording ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 h-14 rounded-[22px]">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase italic text-red-400 whitespace-nowrap">Gravando...</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="h-14 px-4 rounded-[22px] bg-primary text-white font-black text-[10px] uppercase italic tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shrink-0"
                    >
                      <Send size={16} />
                      Enviar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="h-14 w-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-primary transition-all active:scale-95 shrink-0"
                  >
                    <Mic size={22} />
                  </button>
                )}
              </form>
            )}
          </footer>
        </main>
      </div>

      <CreateChannelDialog
        communityId={id}
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
      />

      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent side="right" className="bg-[#0D0D0F] border-l border-white/5 text-white w-[360px] p-0 outline-none flex flex-col">
          <SheetHeader className="p-6 border-b border-white/5 bg-black/20 shrink-0">
            <SheetTitle className="text-xl font-black italic uppercase tracking-tighter mb-1 text-white">
              Players do <span className="text-primary">Hub</span>
            </SheetTitle>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-700 italic">
              {memberCount ?? (members?.length) ?? (community?.member_count || 0)} membros
            </p>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input 
                placeholder="Pesquisar membro..." 
                className="w-full bg-white/5 border-white/10 pl-9 h-10 rounded-xl text-xs placeholder:italic placeholder:uppercase placeholder:tracking-[0.2em] placeholder:text-gray-600 focus-visible:ring-primary/30"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {(["owner", "moderator", "member"] as const).map((role) => {
                const searchLower = memberSearch.trim().toLowerCase();
                const roleMembers = members?.filter((m) => 
                  m.role === role && 
                  (searchLower === "" || m.user?.nickname?.toLowerCase().includes(searchLower))
                ) || [];
                if (roleMembers.length === 0) return null;

                const roleLabel = role === "owner" ? "Dono" : role === "moderator" ? "Moderadores" : "Membros";
                return (
                  <div key={role}>
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic mb-3 px-1">{roleLabel} — {roleMembers.length}</h4>
                    <div className="space-y-2">
                      {roleMembers.map((m) => (
                        <div key={m.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${m.muted ? 'bg-red-500/5 border-red-500/10' : 'bg-white/2 border-transparent hover:border-white/5'}`}>
                          <div className="relative shrink-0">
                            <Link href={`/profile/${m.user?.nickname}`}>
                              <Avatar className="h-10 w-10 border border-white/5 hover:border-primary/50 transition-colors cursor-pointer">
                                <AvatarImage src={m.user?.avatar_url || undefined} />
                                <AvatarFallback className="bg-black text-gray-500 font-black italic text-xs">{m.user?.nickname?.charAt(0) || "P"}</AvatarFallback>
                              </Avatar>
                            </Link>
                            {m.muted && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center pointer-events-none">
                                <Shield size={8} className="text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-black italic uppercase tracking-tighter truncate ${role === 'owner' ? 'text-amber-500' : role === 'moderator' ? 'text-blue-400' : 'text-gray-300'}`}>
                              {m.user?.nickname || "Unknown"}
                            </p>
                            {m.muted && <p className="text-[9px] text-red-400 italic font-black">MUTADO</p>}
                          </div>

                          {(isOwner || (isModerator && role === "member")) && m.user_id !== user?.uid && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Link
                                href={`/profile/${m.user?.nickname}`}
                                title="Ver Perfil"
                                className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                              >
                                <User size={12} />
                              </Link>
                              
                              <button
                                onClick={() => handleMute(m.user_id, m.muted ?? false)}
                                title={m.muted ? "Desmutar" : "Mutar"}
                                className={`p-2 rounded-xl transition-all ${m.muted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10'}`}
                              >
                                <Shield size={12} />
                              </button>
                              
                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => handlePromote(m.user_id, m.role)}
                                    title={m.role === "moderator" ? "Rebaixar" : "Promover"}
                                    className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
                                  >
                                    <Crown size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleBan(m.user_id, m.user?.nickname || "Membro")}
                                    title="Banir Permanentemente"
                                    className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-600 hover:bg-red-600/10 transition-all"
                                  >
                                    <Ban size={12} />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleKick(m.user_id, m.user?.nickname || "Membro")}
                                title="Expulsar"
                                className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {isOwner && (
            <div className="p-4 border-t border-red-500/10 bg-red-500/5 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500/50 italic mb-3">Zona de Perigo</p>
              <button
                onClick={handleDeleteCommunity}
                className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest italic hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <X size={14} /> Excluir Comunidade
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <HubLeaveDialog 
        isOpen={showHubLeaveDialog}
        onClose={() => setShowHubLeaveDialog(false)}
        communityId={id}
        members={members || []}
        onDelete={handleDeleteCommunity}
      />

      <InviteDialog
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        communityId={id}
        communityName={community?.name || "Hub"}
      />

      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        targetId={id}
        targetType={"community" as any}
        targetName={community?.name || "Hub"}
      />
    </div>
  );
}

interface HubLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  members: CommunityMember[];
  onDelete: () => void;
}

function HubLeaveDialog({ isOpen, onClose, communityId, members, onDelete }: HubLeaveDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTransferring, setIsTransferring] = useState(false);
  const moderators = members.filter(m => m.role === 'moderator' && m.user_id !== user?.uid);

  const handleTransfer = async (newOwnerId: string, nick: string) => {
    if (!confirm(`Deseja transferir a propriedade para ${nick}?`)) return;
    
    setIsTransferring(true);
    try {
      const oldOwnerId = user?.uid;
      if (!oldOwnerId) return;

      await updateDoc(doc(db, "community_members", `${communityId}_${newOwnerId}`), {
        role: 'owner'
      });

      await updateDoc(doc(db, "community_members", `${communityId}_${oldOwnerId}`), {
        role: 'member'
      });

      toast.success("Propriedade transferida! Agora você pode sair.");
      queryClient.invalidateQueries({ queryKey: ["community-members", communityId] });
      onClose();
    } catch {
      toast.error("Erro ao transferir propriedade");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D0B1A] border-white/10 text-white rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white">
            Sair do Hub
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
            Como dono, você precisa transferir ou excluir o hub antes de sair.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Transferir Propriedade</h4>
            {moderators.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {moderators.map((mod) => (
                  <div key={mod.user_id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mod.user?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{mod.user?.nickname?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold">{mod.user?.nickname}</span>
                    </div>
                    <Button 
                      size="sm"
                      disabled={isTransferring}
                      onClick={() => handleTransfer(mod.user_id, mod.user?.nickname || "Membro")}
                      className="bg-white text-black hover:bg-gray-200 text-[10px] font-black uppercase italic h-8"
                    >
                      Eleger
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-700 italic border border-dashed border-white/5 p-4 text-center">
                Promova um membro a moderador para transferir
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
             <Button 
               onClick={onDelete}
               variant="destructive"
               className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest italic hover:bg-red-500/20 h-12"
             >
               Ou Excluir Hub Permanentemente
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
