"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth, confirmPasswordReset } from "@/lib/firebase";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams?.get("oobCode");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      toast.error("Link inválido ou expirado.");
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) {
      toast.error("Código de recuperação ausente.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
      toast.success("Senha alterada com sucesso!");

      setTimeout(() => {
        router.push("/auth?mode=login");
      }, 3000);
    } catch (error: any) {
      let message = "Ocorreu um erro ao alterar a senha.";
      if (error.code === "auth/expired-action-code") {
        message = "O link de recuperação expirou.";
      } else if (error.code === "auth/invalid-action-code") {
        message = "O link de recuperação é inválido.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="relative w-full max-w-md border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
        <CardHeader className="text-center pt-12 pb-6 px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 mb-8">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
            Senha Alterada!
          </CardTitle>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            Sua conta está protegida novamente.
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-12 text-center">
          <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            Sua senha foi atualizada com sucesso. Você será redirecionado para a
            tela de login em alguns segundos.
          </p>
          <div className="flex items-center justify-center gap-3 text-primary text-[10px] font-black uppercase tracking-widest italic animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!oobCode) {
    return (
      <Card className="relative w-full max-w-md border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
        <CardHeader className="text-center pt-12 pb-6 px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20 mb-8">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2 leading-tight">
            Link Inválido
          </CardTitle>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            Algo deu errado com seu pedido.
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-12 space-y-8">
          <p className="text-center text-gray-400 font-medium leading-relaxed">
            O link de recuperação de senha é inválido ou já foi utilizado. Por
            favor, solicite um novo link para continuar.
          </p>
          <Link href="/auth?mode=forgot-password" className="block">
            <Button className="w-full h-14 bg-primary hover:opacity-90 text-white font-black italic uppercase rounded-xl shadow-lg shadow-primary/20">
              Solicitar Novo Link
            </Button>
          </Link>
          <Link
            href="/"
            className="block text-center mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
          >
            Voltar ao Início
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-md border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl">
      <CardHeader className="text-center pt-12 pb-6 px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-8">
          <Gamepad2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">
          Nova <span className="text-primary">Senha</span>
        </CardTitle>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          Crie uma combinação forte para sua conta
        </p>
      </CardHeader>

      <CardContent className="px-10 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Nova Senha
            </Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 bg-white/5 border-white/5 h-14 rounded-xl focus:border-primary/50 text-white font-bold"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Confirmar Senha
            </Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-12 pr-12 bg-white/5 border-white/5 h-14 rounded-xl focus:border-primary/50 text-white font-bold"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-primary hover:opacity-90 text-white font-black italic uppercase rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Alterando...
              </div>
            ) : (
              "Confirmar Alteração"
            )}
          </Button>

          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors pt-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Cancelar e Voltar
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mb-8 relative z-10 transition-transform hover:scale-105 duration-500">
        <Link
          href="/"
          className="text-4xl font-black italic tracking-tighter text-primary"
        >
          REVALLO
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 bg-[#0D0D0F]/80 backdrop-blur-xl rounded-[32px] border border-white/5">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Preparando ambiente...
              </p>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
