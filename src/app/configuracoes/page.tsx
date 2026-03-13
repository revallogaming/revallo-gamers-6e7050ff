"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Shield,
  Lock,
  ArrowLeft,
  Save,
  LogOut,
  Mail,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { PixKeyForm } from "@/components/PixKeyForm";

export default function SettingsPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<"account" | "security" | "financial">("account");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        nickname,
        bio,
        updated_at: new Date().toISOString(),
      });
      await refreshProfile();
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Link de redefinição enviado para ${user.email}`);
    } catch {
      toast.error("Erro ao enviar email de redefinição");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setIsSigningOutAll(true);
    try {
      await signOut();
      toast.success("Sessão encerrada em todos os dispositivos");
    } catch {
      toast.error("Erro ao encerrar sessão");
    } finally {
      setIsSigningOutAll(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    { id: "account" as const, label: "Conta", icon: User },
    { id: "security" as const, label: "Segurança", icon: Lock },
    { id: "financial" as const, label: "Financeiro", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <SEO title="Configurações - Revallo" />
      <Header />

      <main className="container py-12 mx-auto px-4 max-w-5xl">
        <div className="mb-10 flex items-center gap-4">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao Perfil
          </Link>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-10">
          Configurações
        </h1>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between p-5 border transition-all group ${
                  activeSection === section.id
                    ? "bg-primary/10 border-primary/30 text-white"
                    : "bg-[#050505] border-white/5 hover:bg-white/2"
                }`}
              >
                <div className="flex items-center gap-4">
                  <section.icon
                    className={`h-4 w-4 transition-colors ${
                      activeSection === section.id ? "text-primary" : "text-gray-700 group-hover:text-primary"
                    }`}
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest italic text-white">
                    {section.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-white transition-all" />
              </button>
            ))}

            <Link href="/configuracoes/privacidade">
              <button className="w-full flex items-center justify-between p-5 bg-[#050505] border border-white/5 hover:bg-white/2 transition-all group">
                <div className="flex items-center gap-4">
                  <Shield className="h-4 w-4 text-gray-700 group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-black uppercase tracking-widest italic text-white">
                    Privacidade
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-white transition-all" />
              </button>
            </Link>

            <div className="pt-8">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center h-14 bg-red-500/5 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-black uppercase italic tracking-widest text-xs"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8 space-y-8">
            {activeSection === "account" && (
              <Card className="bg-[#050505] border-white/5 rounded-none p-8">
                <div className="flex items-center gap-3 mb-8">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black italic uppercase tracking-widest text-white">
                    Dados da Conta
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic ml-1">
                      Nickname Público
                    </Label>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-none h-12 text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-2 opacity-60">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic ml-1">
                      E-mail Cadastrado
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <Input
                        value={user.email || ""}
                        readOnly
                        className="pl-12 bg-white/2 border-white/5 rounded-none h-12 text-sm font-bold text-gray-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic ml-1">
                      Bio / Descrição
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="bg-white/5 border-white/10 rounded-none min-h-[120px] text-sm font-bold resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-none font-black uppercase italic tracking-widest text-xs"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <Card className="bg-[#050505] border-white/5 rounded-none p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <Lock className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-white">
                      Alterar Senha
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed mb-6">
                    Enviaremos um link de redefinição para seu e-mail cadastrado.
                  </p>
                  <Button
                    onClick={handleSendPasswordReset}
                    disabled={isSendingReset}
                    variant="outline"
                    className="w-full h-12 border-white/10 rounded-none bg-white/2 hover:bg-white/5 text-[10px] font-black uppercase italic tracking-widest text-gray-400"
                  >
                    {isSendingReset ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enviar Link de Redefinição"
                    )}
                  </Button>
                </Card>

                <Card className="bg-[#050505] border-red-500/10 rounded-none p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-white">
                      Sessões Ativas
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed mb-6">
                    Encerra sua sessão em todos os dispositivos conectados, incluindo este.
                  </p>
                  <Button
                    onClick={handleSignOutAllDevices}
                    disabled={isSigningOutAll}
                    variant="outline"
                    className="w-full h-12 border-red-500/20 rounded-none bg-red-500/5 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase italic tracking-widest text-red-500 transition-all"
                  >
                    {isSigningOutAll ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair de Todos os Dispositivos
                      </>
                    )}
                  </Button>
                </Card>
              </div>
            )}

            {activeSection === "financial" && (
              <div className="space-y-6">
                <PixKeyForm />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
