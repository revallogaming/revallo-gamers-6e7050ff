"use client";

import { useState } from "react";
import { useCommunities, useCommunityActions, useUserMemberships } from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  ArrowLeft,
  Gamepad2,
  ImageIcon,
  Loader2,
  Search,
  ChevronRight,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { GameType } from "@/types";
import { uploadToCloudinary } from "@/lib/cloudinary";

const GAMES: { value: GameType | ""; label: string }[] = [
  { value: "freefire", label: "Free Fire" },
];

export default function CommunitiesPage() {
  const { data: communities, isLoading } = useCommunities();
  const { user } = useAuth();
  const { data: userMemberships } = useUserMemberships(user?.uid);
  const { joinCommunity, createCommunity } = useCommunityActions();
  const router = useRouter();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    game: "freefire" as GameType,
    banner_url: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const filteredCommunities = communities?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleJoin = async (communityId: string) => {
    if (!user) {
      toast.error("Acesse sua conta para entrar na comunidade!");
      router.push("/auth");
      return;
    }
    try {
      await joinCommunity.mutateAsync({ communityId, userId: user.uid });
      toast.success("Bem-vindo à comunidade!");
    } catch {
      toast.error("Erro ao processar solicitação.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("O nome da comunidade é obrigatório.");
      return;
    }

    try {
      const newId = await createCommunity.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim(),
        game: form.game || null,
        banner_url: form.banner_url.trim() || null,
        userId: user.uid,
      });
      toast.success("Comunidade criada!");
      setShowCreateDialog(false);
      setForm({ name: "", description: "", game: "freefire", banner_url: "" });
      router.push(`/communities/${newId}`);
    } catch {
      toast.error("Houve um erro na criação.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, "banners");
      setForm((prev) => ({ ...prev, banner_url: url }));
    } catch (error) {
      toast.error("Falha no upload.");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <SEO
        title="Comunidades - Revallo"
        description="Hub social gamer da Revallo."
      />
      <Header 
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        searchPlaceholder="BUSCAR COMUNIDADES..."
      />
      <div className="flex-1 overflow-y-auto py-6 md:py-12 px-4 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 md:mb-12 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Início
        </Link>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16">
          <div className="max-w-2xl px-2">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 leading-none pr-2">
              Comuni<span className="text-primary">dades</span>
            </h1>
            <p className="text-gray-400 font-medium text-base md:text-lg leading-relaxed">
              O coração social da Revallo. Crie hubs, encontre parças e domine o
              cenário competitivo com a sua galera.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 px-2">
            <div className="relative group flex-1 sm:min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Buscar comunidades..."
                className="w-full pl-12 bg-white/5 border border-white/5 h-12 rounded-xl focus:border-primary/50 text-white font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (!user) {
                  router.push("/auth");
                } else {
                  setShowCreateDialog(true);
                }
              }}
              className="bg-primary hover:opacity-90 gap-3 rounded-xl h-12 px-8 font-black italic uppercase shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Criar Hub
            </Button>
          </div>
        </div>

        {/* Communities Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-[32px] md:rounded-[40px] bg-white/5 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : filteredCommunities && filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
            {filteredCommunities.map((community) => (
              <Card
                key={community.id}
                className="bg-[#0D0D0F]/80 border-white/5 overflow-hidden group hover:border-primary/50 transition-all duration-500 rounded-[24px] md:rounded-[28px] hover:-translate-y-2 shadow-2xl flex flex-col h-full"
              >
                <Link
                  href={community.type === 'tournament' && community.tournament_id ? `/tournaments/${community.tournament_id}/hub` : `/communities/${community.id}`}
                  className="block relative aspect-video shrink-0"
                >
                  <img
                    src={
                      community.banner_url ||
                      community.icon_url ||
                      "/fictitious-community.png"
                    }
                    className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                    alt={community.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-4 left-6 flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-widest italic rounded-lg px-2.5 h-5 flex items-center gap-1.5 backdrop-blur-md">
                      <Gamepad2 className="h-3 w-3" />
                      {community.game || "Multigame"}
                    </Badge>
                    {community.type === 'tournament' && (
                       <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-widest italic rounded-lg px-2.5 h-5 flex items-center gap-1.5 backdrop-blur-md">
                          <Trophy className="h-3 w-3" />
                          Torneio
                       </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4 md:p-6 flex flex-col flex-1">
                  <h3 className="text-base md:text-lg font-black italic uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors truncate">
                    {community.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-medium mb-4 md:mb-6 line-clamp-2 leading-relaxed h-8 md:h-10">
                    {community.description ||
                      "Hub oficial Revallo para integração de players."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-600 italic">
                        <Users className="h-3.5 w-3.5" />
                        {community.member_count || 0} Membros
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Link href={community.type === 'tournament' && community.tournament_id ? `/tournaments/${community.tournament_id}/hub` : `/communities/${community.id}`} className="flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl h-10 text-[9px] font-black uppercase tracking-widest italic"
                        >
                          {community.owner_id === user?.uid 
                            ? "Administrar" 
                            : community.type === 'tournament' || userMemberships?.includes(community.id) 
                              ? "Abrir Chat" 
                              : "Ver Detalhes"}
                        </Button>
                      </Link>
                      <Link href={community.type === 'tournament' ? `/tournaments/${community.tournament_id}/hub` : `/communities/${community.id}`} className="shrink-0">
                        <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl h-10 w-10 flex items-center justify-center p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/2 border border-dashed border-white/5 rounded-[50px]">
            <div className="h-24 w-24 rounded-[32px] bg-white/5 flex items-center justify-center mb-8 border border-white/5">
              <Users className="h-10 w-10 text-gray-700" />
            </div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">
              Nenhuma <span className="text-primary">Comunidade</span>
            </h3>
            <p className="text-gray-500 max-w-sm font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-10">
              Não encontramos resultados para sua busca ou o hub ainda não foi
              criado.
            </p>
            {user && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:opacity-90 h-14 px-12 rounded-2xl font-black italic uppercase shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                Inaugurar Comunidade
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialog: Create Hub */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0D0D0F] border-white/5 text-white max-w-lg rounded-[40px] p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
              Criar <span className="text-primary">Hub Hub</span>
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">
              Defina o nome e a vibe do seu grupo de elite.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block px-2">
                Identidade do Hub
              </Label>
              <Input
                placeholder="Ex: Clan dos Renegados"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/5 text-white h-14 rounded-2xl font-black italic uppercase tracking-widest px-6"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block px-2">
                Manifesto (Bio)
              </Label>
              <Textarea
                placeholder="Qual o objetivo desse hub?"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="bg-white/5 border-white/5 text-white rounded-2xl font-medium resize-none px-6 py-4 min-h-[100px]"
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block px-2">
                  Atividade Principal
                </Label>
                <div className="h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center px-6 opacity-70">
                  <span className="text-[10px] font-black italic uppercase tracking-widest text-primary">Free Fire</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block px-2">
                  Capa Visual
                </Label>
                <div
                  className="relative h-14 w-full border-2 border-dashed border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all flex items-center justify-center bg-white/2"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  {imagePreview || form.banner_url ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview || form.banner_url}
                        className="h-10 w-10 object-cover rounded-lg"
                        alt="Preview"
                      />
                      <span className="text-[10px] font-black uppercase text-primary italic">
                        Alterar Banner
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase italic tracking-widest">
                        Enviar Arte
                      </span>
                    </div>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 bg-white/2 hover:bg-white/5 text-gray-500 rounded-2xl h-14 font-black italic uppercase text-[11px]"
                onClick={() => setShowCreateDialog(false)}
              >
                Agora Não
              </Button>
              <Button
                type="submit"
                className="flex-2 bg-primary hover:opacity-90 text-white rounded-2xl h-14 px-10 font-black italic uppercase text-[11px] shadow-lg shadow-primary/20"
                disabled={createCommunity.isPending || isUploading}
              >
                {createCommunity.isPending
                  ? "Configurando..."
                  : isUploading
                    ? "Enviando Capa..."
                    : "Confirmar Criação"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
