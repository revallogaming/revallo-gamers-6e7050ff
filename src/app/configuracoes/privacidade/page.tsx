"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Trophy,
  Bell,
  Eye,
  Ban,
  Loader2,
  Save,
  X,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFollowerProfiles } from "@/hooks/useFollowers";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PrivacySettings {
  whoCanFollow: "anyone" | "approved";
  whoCanMessage: "anyone" | "following" | "followers" | "nobody";
  tournamentVisibility: "public" | "followers" | "private";
  tournamentInvites: "anyone" | "followers" | "following" | "nobody";
  showTournamentsActivity: boolean;
  showCommunitiesActivity: boolean;
  showAchievements: boolean;
  notifyNewFollowers: boolean;
  notifyTournamentInvites: boolean;
  notifyMessages: boolean;
  notifyCommunityUpdates: boolean;
  blockedUsers: string[];
}

const DEFAULT_SETTINGS: PrivacySettings = {
  whoCanFollow: "anyone",
  whoCanMessage: "anyone",
  tournamentVisibility: "public",
  tournamentInvites: "anyone",
  showTournamentsActivity: true,
  showCommunitiesActivity: true,
  showAchievements: true,
  notifyNewFollowers: true,
  notifyTournamentInvites: true,
  notifyMessages: true,
  notifyCommunityUpdates: true,
  blockedUsers: [],
};

export default function PrivacidadePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blockInput, setBlockInput] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingUser, setReportingUser] = useState<{ id: string, nickname: string } | null>(null);

  const { data: followers } = useFollowerProfiles(user?.uid);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, "privacy_settings", user.uid));
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as PrivacySettings);
        }
      } catch {
        // use defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "privacy_settings", user.uid), {
        ...settings,
        updated_at: new Date().toISOString(),
      });
      toast.success("Configurações de privacidade salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const set = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlockUser = () => {
    const nick = blockInput.trim();
    if (!nick) return;
    if (settings.blockedUsers.includes(nick)) {
      toast.error("Usuário já bloqueado");
      return;
    }
    set("blockedUsers", [...settings.blockedUsers, nick]);
    setBlockInput("");
    toast.success(`${nick} bloqueado`);
  };

  const handleUnblock = (nick: string) => {
    set("blockedUsers", settings.blockedUsers.filter((u) => u !== nick));
    toast.success(`${nick} desbloqueado`);
  };

  const handleReport = (id: string, nickname: string) => {
    setReportingUser({ id, nickname });
    setShowReportDialog(true);
  };

  if (!user || loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <SEO title="Privacidade - Revallo" />
      <Header />

      <main className="container py-12 mx-auto px-4 max-w-3xl">
        <div className="mb-10">
          <Link
            href="/configuracoes"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar às Configurações
          </Link>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-10">
          Privacidade
        </h1>

        <div className="space-y-6">

          {/* Followers */}
          <Section icon={Users} title="Seguidores" desc="Controle quem pode seguir você.">
            <RadioGroup
              value={settings.whoCanFollow}
              onValueChange={(v) => set("whoCanFollow", v as any)}
              className="space-y-3"
            >
              <RadioItem value="anyone" label="Qualquer pessoa" />
              <RadioItem value="approved" label="Apenas usuários aprovados por mim" />
            </RadioGroup>
          </Section>

          {/* Direct Messages */}
          <Section icon={MessageSquare} title="Mensagens (Direct)" desc="Controle quem pode enviar mensagens.">
            <RadioGroup
              value={settings.whoCanMessage}
              onValueChange={(v) => set("whoCanMessage", v as any)}
              className="space-y-3"
            >
              <RadioItem value="anyone" label="Qualquer usuário" />
              <RadioItem value="following" label="Apenas pessoas que sigo" />
              <RadioItem value="followers" label="Apenas meus seguidores" />
              <RadioItem value="nobody" label="Ninguém" />
            </RadioGroup>
          </Section>

          {/* Tournament Visibility */}
          <Section icon={Trophy} title="Torneios" desc="Controle quem pode ver seus torneios criados.">
            <RadioGroup
              value={settings.tournamentVisibility}
              onValueChange={(v) => set("tournamentVisibility", v as any)}
              className="space-y-3"
            >
              <RadioItem value="public" label="Público" />
              <RadioItem value="followers" label="Apenas meus seguidores" />
              <RadioItem value="private" label="Privado" />
            </RadioGroup>
          </Section>

          {/* Tournament Invites */}
          <Section icon={Trophy} title="Convites de Torneio" desc="Controle quem pode te convidar para torneios.">
            <RadioGroup
              value={settings.tournamentInvites}
              onValueChange={(v) => set("tournamentInvites", v as any)}
              className="space-y-3"
            >
              <RadioItem value="anyone" label="Qualquer pessoa" />
              <RadioItem value="followers" label="Apenas meus seguidores" />
              <RadioItem value="following" label="Apenas pessoas que sigo" />
              <RadioItem value="nobody" label="Ninguém" />
            </RadioGroup>
          </Section>

          {/* Activity */}
          <Section icon={Eye} title="Atividade" desc="Controle o que as pessoas veem sobre você.">
            <div className="space-y-4">
              <ToggleRow
                label="Mostrar torneios que participo"
                checked={settings.showTournamentsActivity}
                onChange={(v) => set("showTournamentsActivity", v)}
              />
              <ToggleRow
                label="Mostrar comunidades que sigo"
                checked={settings.showCommunitiesActivity}
                onChange={(v) => set("showCommunitiesActivity", v)}
              />
              <ToggleRow
                label="Mostrar conquistas"
                checked={settings.showAchievements}
                onChange={(v) => set("showAchievements", v)}
              />
            </div>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notificações Sociais" desc="Controle quais alertas você recebe.">
            <div className="space-y-4">
              <ToggleRow
                label="Novos seguidores"
                checked={settings.notifyNewFollowers}
                onChange={(v) => set("notifyNewFollowers", v)}
              />
              <ToggleRow
                label="Convites de torneio"
                checked={settings.notifyTournamentInvites}
                onChange={(v) => set("notifyTournamentInvites", v)}
              />
              <ToggleRow
                label="Mensagens"
                checked={settings.notifyMessages}
                onChange={(v) => set("notifyMessages", v)}
              />
              <ToggleRow
                label="Atualizações de comunidade"
                checked={settings.notifyCommunityUpdates}
                onChange={(v) => set("notifyCommunityUpdates", v)}
              />
            </div>
          </Section>

          {/* Followers List with Block Actions */}
          <Section icon={Users} title="Gerenciar Seguidores" desc="Seus seguidores atuais. Você pode bloqueá-los ou denunciá-los aqui.">
            <div className="space-y-4">
              {followers && followers.length > 0 ? (
                <div className="grid gap-3">
                  {followers.map((f) => {
                    const isBlocked = settings.blockedUsers.includes(f.nickname);
                    return (
                      <div key={f.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 group">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarImage src={f.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">{f.nickname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase italic text-white">{f.nickname}</span>
                            {f.bio && <span className="text-[9px] font-bold text-gray-500 line-clamp-1">{f.bio}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReport(f.id, f.nickname)}
                            className="text-[10px] font-black uppercase italic tracking-widest text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 h-8 px-3"
                          >
                            <Flag className="h-3 w-3 mr-1" /> Denunciar
                          </Button>
                          <Button 
                            size="sm"
                            variant={isBlocked ? "ghost" : "destructive"}
                            onClick={() => isBlocked ? handleUnblock(f.nickname) : set("blockedUsers", [...settings.blockedUsers, f.nickname])}
                            className={`text-[10px] font-black uppercase italic tracking-widest h-8 px-3 ${isBlocked ? 'text-green-500 hover:text-green-400 hover:bg-green-500/10' : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-none'}`}
                          >
                            {isBlocked ? "Desbloquear" : "Bloquear"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] font-black uppercase tracking-widest italic text-gray-700 py-4 text-center border border-dashed border-white/5">
                  Você ainda não possui seguidores
                </p>
              )}
            </div>
          </Section>

          {/* Blocked Users Manual Input */}
          <Section icon={Ban} title="Bloqueios Manuais" desc="Bloqueie usuários inserindo o nickname.">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBlockUser()}
                  placeholder="Nickname do usuário..."
                  className="bg-white/5 border-white/10 rounded-none h-12 text-sm font-bold flex-1"
                />
                <Button
                  onClick={handleBlockUser}
                  className="bg-white text-black hover:bg-gray-200 rounded-none h-12 px-8 font-black uppercase italic tracking-widest text-[10px]"
                >
                  Bloquear
                </Button>
              </div>

              {settings.blockedUsers.length > 0 && (
                <div className="pt-4 space-y-2 border-t border-white/5">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 italic mb-2">Usuários Bloqueados</h4>
                  <div className="flex flex-wrap gap-2">
                    {settings.blockedUsers.map((nick) => (
                      <div key={nick} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5">
                        <span className="text-[10px] font-black uppercase italic text-red-500">{nick}</span>
                        <button onClick={() => handleUnblock(nick)} className="text-red-500 hover:text-white transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-none font-black uppercase italic tracking-widest text-xs"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {reportingUser && (
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            targetId={reportingUser.id}
            targetType="user"
            targetName={reportingUser.nickname}
          />
        )}
      </main>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-[#050505] border-white/5 rounded-none p-8">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black italic uppercase tracking-widest text-white">{title}</h3>
      </div>
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">{desc}</p>
      {children}
    </Card>
  );
}

function RadioItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={value} className="border-white/20 text-primary" />
      <Label htmlFor={value} className="text-[11px] font-black uppercase italic tracking-widest text-gray-300 cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-[11px] font-black uppercase italic tracking-widest text-gray-300">
        {label}
      </Label>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
