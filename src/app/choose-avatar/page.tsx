"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AVATARS = [
  {
    id: "warrior",
    src: "/avatars/avatar_warrior.png",
    name: "Guerreiro Cyber",
    color: "from-blue-500/40 to-cyan-500/20",
  },
  {
    id: "ninja",
    src: "/avatars/avatar_ninja.png",
    name: "Ninja das Sombras",
    color: "from-purple-500/40 to-indigo-500/20",
  },
  {
    id: "hacker",
    src: "/avatars/avatar_hacker.png",
    name: "Hacker Verde",
    color: "from-green-500/40 to-emerald-500/20",
  },
  {
    id: "sniper",
    src: "/avatars/avatar_sniper.png",
    name: "Atiradora de Elite",
    color: "from-red-500/40 to-rose-500/20",
  },
  {
    id: "mage",
    src: "/avatars/avatar_mage.png",
    name: "Mago Arcano",
    color: "from-amber-500/40 to-yellow-500/20",
  },
  {
    id: "default",
    src: null,
    name: "Sem Avatar",
    color: "from-gray-500/20 to-gray-700/20",
  },
];

export default function ChooseAvatarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string>("warrior");
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const avatarObj = AVATARS.find((a) => a.id === selected);
      const avatarUrl = avatarObj?.src || null;

      await updateDoc(doc(db, "profiles", user.uid), {
        avatar_url: avatarUrl,
        avatar_id: selected,
        updated_at: new Date().toISOString(),
      });

      if (avatarUrl) {
        await updateProfile(user, { photoURL: avatarUrl });
      }

      router.push("/tournaments");
    } catch (err) {
      console.error("Error saving avatar:", err);
      router.push("/tournaments");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedAvatar = AVATARS.find((a) => a.id === selected);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="text-3xl font-black italic tracking-tighter text-primary mb-4">
            REVALLO
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-3">
            Escolha seu <span className="text-primary">Avatar</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            Quem você é no campo de batalha?
          </p>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-5 mb-12">
          {AVATARS.filter((a) => a.id !== "default").map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelected(avatar.id)}
              onMouseEnter={() => setHovered(avatar.id)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative flex flex-col items-center gap-3 transition-all duration-300 ${
                selected === avatar.id ? "scale-110" : "hover:scale-105"
              }`}
            >
              <div
                className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-2xl ${
                  selected === avatar.id
                    ? "border-primary shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${avatar.color}`}
                />
                {avatar.src ? (
                  <img
                    src={avatar.src}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎮
                  </div>
                )}

                {selected === avatar.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-widest transition-colors text-center leading-tight ${
                  selected === avatar.id
                    ? "text-primary"
                    : "text-gray-500 group-hover:text-white"
                }`}
              >
                {avatar.name}
              </span>
            </button>
          ))}
        </div>

        {/* Preview & Confirm */}
        <div className="flex flex-col items-center gap-6">
          {selectedAvatar && selectedAvatar.src && (
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50">
                <img
                  src={selectedAvatar.src}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase">
                  {selectedAvatar.name}
                </p>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  Avatar selecionado
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="h-16 px-16 bg-primary hover:opacity-90 text-white font-black uppercase italic text-lg rounded-2xl transition-all hover:scale-105 gap-3"
          >
            {saving ? "Salvando..." : "Entrar na Arena"}
            {!saving && <ChevronRight className="w-5 h-5" />}
          </Button>

          <button
            onClick={() => router.push("/tournaments")}
            className="text-gray-600 text-xs font-bold hover:text-gray-400 transition-colors uppercase tracking-widest"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  );
}
