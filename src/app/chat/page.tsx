"use client";

import { MessageSquare, Search, Send, Hash, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trophy, Copy, CheckCircle, Clock, Users, UserPlus } from "lucide-react";
import { Header } from "@/components/Header";
import { useCommunities, useChannels } from "@/hooks/useCommunities";
import { useChat } from "@/hooks/useChat";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Channel, Community } from "@/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCommunityId = searchParams?.get("communityId");
  const initialChannelId = searchParams?.get("channelId");

  const { data: communities, isLoading: loadingCommunities } = useCommunities();
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Auto-select from URL
  useEffect(() => {
    if (communities && initialCommunityId && !activeCommunityId) {
      setActiveCommunityId(initialCommunityId);
    }
  }, [communities, initialCommunityId, activeCommunityId]);

  useEffect(() => {
    if (initialChannelId && !activeChannelId) {
      setActiveChannelId(initialChannelId);
    }
  }, [initialChannelId, activeChannelId]);
  
  const activeCommunity = useMemo(() => 
    communities?.find((c: Community) => c.id === activeCommunityId),
    [communities, activeCommunityId]
  );
  const { data: channels, isLoading: loadingChannels } = useChannels(activeCommunityId || "");
  const activeChannel = channels?.find((c: Channel) => c.id === activeChannelId);

  const {
    messages,
    loading: loadingChat,
    sendMessage,
    canSendMessage,
  } = useChat(
    activeCommunityId || "", 
    activeChannelId || "", 
    activeChannel?.type, 
    activeCommunity?.owner_id
  );

  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set default channel when community changes
  useEffect(() => {
    if (channels && channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  useEffect(() => {
    if (activeCommunityId) {
      setActiveChannelId(null); // Reset channel when switching community
    }
  }, [activeCommunityId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const { userTeams } = useTeams(user?.uid);
  const userTeam = userTeams.data?.[0]; // Default to first team for now, should ideally be context-aware

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !activeCommunityId || !activeChannelId) return;

    try {
      await sendMessage.mutateAsync({ 
        text: message, 
        teamName: userTeam?.name 
      });
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Communities Sidebar */}
        <aside className="w-20 border-r border-white/5 bg-[#08080A] flex flex-col h-full shrink-0 py-6 items-center gap-4">
          {communities?.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveCommunityId(ch.id)}
              title={ch.name}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                activeCommunityId === ch.id
                  ? "ring-2 ring-primary ring-offset-4 ring-offset-[#08080A]"
                  : "grayscale hover:grayscale-0 opacity-50 hover:opacity-100"
              }`}
            >
              {ch.banner_url ? (
                <img src={ch.banner_url} className="w-full h-full object-cover" />
              ) : (
                <div className="bg-white/10 w-full h-full flex items-center justify-center text-white font-black">
                  {ch.name[0]}
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Channel List */}
        <aside className="w-64 border-r border-white/5 bg-[#0D0D0F] flex flex-col h-full shrink-0">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xs font-black italic uppercase tracking-[0.2em] text-gray-500 mb-4 truncate pr-2">
              {activeCommunity?.name || "Comunidade"}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
              <input
                placeholder="Buscar canal..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-2 text-[10px] focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingChannels ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              channels?.map((channel: Channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl transition-all text-left group ${
                    activeChannelId === channel.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white/5 text-gray-500 hover:text-white"
                  }`}
                >
                  <Hash className={`w-4 h-4 ${activeChannelId === channel.id ? "text-primary" : "text-gray-700"}`} />
                  <span className="text-xs font-black italic uppercase tracking-tighter truncate pr-2">
                    {channel.name}
                  </span>
                  {channel.type === 'broadcast' && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0C]">
          {activeChannelId ? (
            <>
              <div className="p-6 border-b border-white/5 bg-[#0D0D0F]/50 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activeChannel?.type === 'broadcast' ? 'bg-primary shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'} animate-pulse`} />
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-white mb-0.5 pr-2">
                      {activeCommunity?.name || "Chat Arena"}
                    </h3>
                    <span className="text-sm font-black italic uppercase truncate pr-2">
                      #{activeChannel?.name}
                    </span>
                    {activeChannel?.type === 'broadcast' && (
                      <span className="text-[8px] font-black uppercase text-primary tracking-widest -mt-0.5">
                        Canal Restrito · Apenas Organização
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
              >
                {loadingChat ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                      Sincronizando Mensagens...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/2 border border-dashed border-white/5 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-gray-800" />
                    </div>
                    <div>
                      <p className="text-sm font-black italic uppercase text-white mb-1">
                        O silêncio é uma prece...
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                        Seja o primeiro a mandar o papo reto!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs overflow-hidden shrink-0 shadow-xl group-hover:border-primary/20 transition-all">
                        {msg.user_photo ? (
                          <img
                            src={msg.user_photo}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <span className="text-primary">
                            {msg.user_name?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            {msg.team_name && (
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg italic">
                                {msg.team_name}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-black italic uppercase tracking-tighter ${msg.user_id === user?.uid ? "text-primary" : "text-white"}`}
                            >
                              {msg.user_name}
                            </span>
                          </div>
                          <span className="text-[8px] text-gray-700 font-black italic">
                            {msg.created_at?.toDate
                              ? format(msg.created_at.toDate(), "HH:mm", {
                                  locale: ptBR,
                                })
                              : "agora"}
                          </span>
                        </div>
                        <div className="p-4 rounded-3xl rounded-tl-none bg-white/3 border border-white/3 group-hover:bg-white/5 group-hover:border-white/10 transition-all text-sm text-gray-400 font-medium max-w-2xl leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-[#0D0D0F]/30">
                {!canSendMessage ? (
                  <div className="h-16 flex items-center justify-center bg-white/2 border border-dashed border-white/5 rounded-2xl px-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 italic text-center">
                      ❌ Apenas Organizadores e Admins podem enviar mensagens neste canal.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="relative">
                    <input
                      type="text"
                      placeholder="Mande o papo aqui..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-8 pr-20 text-sm font-medium focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-gray-700 placeholder:italic placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                    />
                    <Button
                      type="submit"
                      className="absolute right-3 top-3 h-10 w-10 p-0 bg-primary hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                      disabled={sendMessage.isPending || !message.trim()}
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.03)_0%,transparent_100%)]">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                <div className="relative w-32 h-32 rounded-[48px] bg-white/2 border border-white/5 flex items-center justify-center backdrop-blur-xl">
                  <MessageSquare className="h-12 w-12 text-primary/50" />
                </div>
              </div>
              <div className="space-y-3 max-w-sm">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Fala que eu<br />te escuto!
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic leading-relaxed">
                  Conecte-se com sua comunidade.<br />Escolha um canal e mude o jogo.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0C]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
