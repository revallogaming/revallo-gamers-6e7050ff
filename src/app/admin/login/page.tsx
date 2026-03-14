"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    // If already authorized in this tab, just go to dashboard
    const authorized = sessionStorage.getItem("admin_access_key");
    const uid = sessionStorage.getItem("admin_uid");
    
    if (authorized && uid) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Por favor, insira uma chave");
      return;
    }

    setIsAuthorizing(true);
    try {
      const response = await fetch("/api/admin/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", key: password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Save key and identity info
        sessionStorage.setItem("admin_access_key", password);
        sessionStorage.setItem("admin_uid", result.uid);
        sessionStorage.setItem("admin_is_owner", result.isOwner.toString());

        toast.success("Acesso administrativo desbloqueado!");
        router.push("/admin/dashboard");
      } else {
        toast.error(result.error || "Chave de acesso inválida");
      }
    } catch (error) {
      console.error("Authorize error:", error);
      toast.error("Erro ao validar a chave no servidor");
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05040a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-sm p-10 rounded-[40px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl relative z-10 shadow-2xl">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-glow-sm">
          <Lock className="text-primary h-10 w-10 animate-pulse" />
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
            Painel <span className="text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">Admin</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic opacity-80">Chave de Acesso • Dono & Staff</p>
        </div>

        <form onSubmit={handleAuthorize} className="space-y-6">
          <div className="space-y-2 relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthorizing}
              className="bg-white/5 border-white/10 h-16 rounded-2xl text-center font-black tracking-[0.4em] focus-visible:ring-primary/40 focus-visible:border-primary/40 text-lg transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          <Button 
            type="submit"
            disabled={isAuthorizing}
            className="w-full h-16 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all shadow-glow-sm"
          >
            {isAuthorizing ? "Validando..." : "Autorizar Acesso"}
          </Button>
        </form>

        <Link href="/" className="flex items-center justify-center gap-2 mt-10 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors italic group">
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para a Início
        </Link>
      </div>
    </div>
  );
}
