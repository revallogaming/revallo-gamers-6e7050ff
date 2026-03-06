"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tournament, STATUS_INFO } from "@/types";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  User,
  ChevronRight,
  Loader2,
  Settings,
  Shield,
  Zap,
  Pencil,
  Calendar,
} from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AvatarEditDialog } from "@/components/AvatarEditDialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const queryClient = useQueryClient();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-white">
            Acesse sua conta para ver seu perfil
          </h1>
          <Button
            onClick={() => router.push("/auth")}
            className="bg-primary h-12 px-8 rounded-2xl font-black uppercase italic tracking-widest text-[11px]"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white relative">
      <SEO title={`${profile.nickname} - Revallo`} />
      <Header />

      <main className="container py-12 mx-auto px-4 max-w-7xl">
        {/* Profile Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0D0B1A] border border-white/5 p-10 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

            {/* Avatar */}
            <div className="relative shrink-0 group">
              <Avatar className="h-40 w-40 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-95 duration-500">
                <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-4xl font-black italic text-primary">
                  {profile.nickname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditAvatarOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white"
              >
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                  <Pencil className="h-6 w-6" />
                </div>
              </button>
              {/* Verification badge — big */}
              <div className="absolute -bottom-2 -right-2 bg-[#0D0B1A] p-1.5 rounded-full border border-white/10">
                <VerificationBadge type="verified" size="xl" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                  {profile.nickname}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">
                  <span className="flex items-center gap-2">
                    <span className="text-white text-lg tracking-tighter">0</span> Seguidores
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-white text-lg tracking-tighter">0</span> Seguindo
                  </span>
                </div>
              </div>

              <p className="text-gray-400 font-medium italic leading-relaxed max-w-2xl mb-8">
                {profile.bio || "Este player prefere manter o mistério sobre sua jornada."}
              </p>

              {/* Edit Profile button — principal CTA */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Button
                  onClick={() => router.push("/configuracoes")}
                  className="bg-primary h-12 px-10 rounded-2xl font-black uppercase italic tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Tournaments */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Torneios <span className="text-primary italic">Criados</span>
              </h2>
              <Link href="/tournaments">
                <Button
                  variant="ghost"
                  className="text-[10px] font-black uppercase tracking-widest italic text-gray-500 hover:text-white"
                >
                  Ver Todos <ChevronRight size={14} className="ml-1" />
                </Button>
              </Link>
            </div>

            <TournamentGrid profileId={user.uid} />
          </div>

          {/* Right: Configurações menu */}
          <div className="lg:col-span-4 space-y-10">
            <section className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 italic px-2">
                Configurações
              </h3>
              <div className="space-y-3">
                <AccessMenuItem
                  icon={User}
                  label="CONTA"
                  onClick={() => router.push("/configuracoes")}
                />
                <AccessMenuItem
                  icon={Shield}
                  label="PRIVACIDADE"
                  onClick={() => router.push("/configuracoes")}
                />
                <AccessMenuItem
                  icon={Zap}
                  label="FINANCEIRO"
                  onClick={() => router.push("/dashboard/financeiro")}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      <AvatarEditDialog 
        isOpen={isEditAvatarOpen}
        onOpenChange={setIsEditAvatarOpen}
        currentAvatar={profile.avatar_url}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] });
        }}
      />
    </div>
  );
}

function AccessMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-16 bg-[#0D0B1A] border border-white/5 rounded-2xl px-6 flex items-center justify-between group hover:border-primary/30 hover:bg-white/[0.02] transition-all"
    >
      <div className="flex items-center gap-4">
        <Icon
          size={18}
          className="text-gray-600 group-hover:text-primary transition-colors"
        />
        <span className="text-[11px] font-black uppercase italic tracking-widest text-white">
          {label}
        </span>
      </div>
      <ChevronRight
        size={16}
        className="text-gray-800 group-hover:text-primary group-hover:translate-x-1 transition-all"
      />
    </button>
  );
}

function TournamentGrid({ profileId }: { profileId: string }) {
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot | null)[]>([null]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["my-tournaments", profileId, page],
    queryFn: async () => {
      const cursor = cursors[page];
      // Single orderBy only — avoids composite index requirement
      // Filter by organizer_id client-side (or use where only, no orderBy)
      const constraints: any[] = [
        where("organizer_id", "==", profileId),
        limit(PAGE_SIZE),
      ];
      if (cursor) constraints.push(startAfter(cursor));

      const q = query(collection(db, "tournaments"), ...constraints);
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      // Sort client-side by start_date desc
      const tournaments = docs
        .map((d) => ({ id: d.id, ...d.data() } as Tournament))
        .sort((a, b) => {
          const da = new Date(a.start_date ?? 0).getTime();
          const db2 = new Date(b.start_date ?? 0).getTime();
          return db2 - da;
        });

      return {
        tournaments,
        lastDoc: docs[docs.length - 1] ?? null,
        hasMore: docs.length === PAGE_SIZE,
      };
    },
    enabled: !!profileId,
  });

  const handleNextPage = () => {
    if (data?.lastDoc) {
      setCursors((prev) => [...prev, data.lastDoc]);
      setPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-[#0D0B1A] border border-white/5 rounded-[32px] aspect-[4/5] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const tournaments = data?.tournaments ?? [];

  if (tournaments.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-white/5 rounded-[32px]">
        <Trophy size={40} className="mx-auto mb-4 text-gray-700" />
        <p className="text-[10px] font-black uppercase tracking-widest italic text-gray-600 mb-6">
          Nenhum torneio criado ainda
        </p>
        <Link href="/tournaments">
          <Button className="bg-primary h-12 px-8 rounded-2xl font-black uppercase italic tracking-widest text-[11px]">
            Explorar Torneios
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>

      {(page > 0 || data?.hasMore) && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={page === 0 || isFetching}
            className="border-white/10 rounded-2xl h-10 px-6 font-black uppercase italic tracking-widest text-[10px]"
          >
            Anterior
          </Button>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
            Página {page + 1}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!data?.hasMore || isFetching}
            className="border-white/10 rounded-2xl h-10 px-6 font-black uppercase italic tracking-widest text-[10px]"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const statusInfo = STATUS_INFO[tournament.status];

  return (
    <Card className="bg-[#0D0B1A] border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/40 transition-all duration-500 relative aspect-[4/5]">
      {tournament.banner_url && (
        <img
          src={tournament.banner_url}
          alt={tournament.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
        />
      )}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 flex flex-col justify-end">
        <Badge
          className={cn(
            "w-fit mb-4 text-[9px] font-black uppercase italic rounded-lg border-0 shadow-lg",
            tournament.status === "open"
              ? "bg-green-500 text-black shadow-green-500/20"
              : tournament.status === "upcoming"
              ? "bg-blue-500 text-white shadow-blue-500/20"
              : "bg-gray-700 text-white"
          )}
        >
          {statusInfo?.label || tournament.status}
        </Badge>

        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none line-clamp-2">
          {tournament.title}
        </h4>

        {tournament.prize_description && (
          <p className="text-xl font-black italic text-primary mb-4 leading-none">
            {tournament.prize_description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4 text-[9px] font-black uppercase tracking-widest text-gray-500 italic">
          <Calendar size={10} />
          {tournament.start_date
            ? format(new Date(tournament.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            : "Data a definir"
          }
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl h-12 flex items-center justify-center gap-2 group-hover:bg-primary/20 transition-colors">
            <Users size={14} className="text-primary" />
            <span className="text-[10px] font-black italic text-white leading-none">
              {tournament.current_participants}/{tournament.max_participants}
            </span>
          </div>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="bg-white/5 rounded-xl h-12 flex items-center justify-center gap-2 hover:bg-primary/30 transition-colors"
          >
            <span className="text-[10px] font-black italic text-white leading-none">
              Gerenciar
            </span>
            <ChevronRight size={12} className="text-primary" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
