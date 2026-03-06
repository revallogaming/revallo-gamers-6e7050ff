"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validateNickname } from "@/lib/nicknameFilter";

type AuthMode = "login" | "signup" | "forgot-password";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode = (searchParams?.get("mode") as AuthMode) || "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    const isGuestParam = searchParams?.get("guest") === "true";
    const urlMode = searchParams?.get("mode") as AuthMode | null;

    if (isGuestParam && mode === "login" && !urlMode) {
      router.replace("/tournaments");
      return;
    }

    if (
      urlMode &&
      ["login", "signup", "forgot-password"].includes(urlMode) &&
      urlMode !== mode
    ) {
      setMode(urlMode);
    }
  }, [searchParams, router, mode]);

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("mode", newMode);
    router.replace(`/auth?${params.toString()}`, { scroll: false });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameOk, setNicknameOk] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value.length >= 3) {
      const result = validateNickname(value);
      setNicknameError(
        result.valid ? null : result.error || "Nickname inválido",
      );
      setNicknameOk(result.valid);
    } else {
      setNicknameError(null);
      setNicknameOk(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!" });
        router.push("/tournaments");
      } else if (mode === "signup") {
        // Nickname validation
        const nicknameResult = validateNickname(nickname);
        if (!nicknameResult.valid) {
          toast({
            title: nicknameResult.error || "Nickname inválido",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (!ageConfirmed) {
          toast({
            title:
              "Confirme que você tem 18 anos ou autorização do responsável",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (!termsConfirmed) {
          toast({
            title: "Você deve aceitar os Termos de Uso para continuar",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, nickname);
        if (error) throw error;
        toast({
          title: "Conta criada! Escolha seu avatar.",
          description: "Bem-vindo à Revallo!",
        });
        // Redirect to avatar selection after signup
        router.push("/choose-avatar");
      } else if (mode === "forgot-password") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada.",
        });
        setMode("login");
        router.replace("/auth?mode=login", { scroll: false });
      }
    } catch (error: unknown) {
      toast({
        title: "Atenção",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none shadow-glow-lg" />

      <Card className="relative w-full max-w-md border-white/10 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pt-10">
          <Link
            href="/"
            className="text-3xl font-black italic tracking-tighter text-primary hover:scale-105 transition-transform inline-block"
          >
            REVALLO
          </Link>
          <CardTitle className="text-lg font-bold text-gray-400 uppercase tracking-widest">
            {mode === "login"
              ? "Entre na sua conta"
              : mode === "signup"
                ? "Crie sua conta"
                : "Recuperar senha"}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="nickname"
                  className="text-xs font-black uppercase tracking-widest text-gray-400"
                >
                  Nickname
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="nickname"
                    placeholder="Seu nome de jogador (min. 3 chars)"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    className={`pl-12 pr-12 h-12 bg-white/5 rounded-xl transition-all ${
                      nicknameError
                        ? "border-red-500/60 focus:border-red-500"
                        : nicknameOk
                          ? "border-green-500/60 focus:border-green-500"
                          : "border-white/10 focus:border-primary/50"
                    }`}
                    maxLength={30}
                  />
                  {nicknameError && (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                  {nicknameOk && !nicknameError && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {nicknameError && (
                  <p className="text-xs text-red-400 font-bold flex items-center gap-1 pl-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {nicknameError}
                  </p>
                )}
                {!nicknameError && nickname.length > 0 && (
                  <p className="text-[10px] text-gray-600 pl-1">
                    Apenas letras, números, _ e . São proibidas palavras
                    ofensivas.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-widest text-gray-400"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                  required
                />
              </div>
            </div>

            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-black uppercase tracking-widest text-gray-400"
                  >
                    Senha
                  </Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("forgot-password")}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {mode === "signup" &&
                  password.length > 0 &&
                  password.length < 6 && (
                    <p className="text-xs text-red-400 font-bold pl-1">
                      Senha deve ter pelo menos 6 caracteres
                    </p>
                  )}
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-3">
                <label
                  htmlFor="age-confirmation"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-all"
                >
                  <input
                    id="age-confirmation"
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed select-none">
                    Tenho 18 anos ou mais, ou possuo autorização do meu
                    responsável legal.
                  </span>
                </label>
                <label
                  htmlFor="terms-confirmation"
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-all"
                >
                  <input
                    id="terms-confirmation"
                    type="checkbox"
                    checked={termsConfirmed}
                    onChange={(e) => setTermsConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed select-none">
                    Li e concordo com os{" "}
                    <Link
                      href="/termos-de-uso"
                      className="text-primary hover:underline font-bold"
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      href="/politica-de-privacidade"
                      className="text-primary hover:underline font-bold"
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-white font-black uppercase italic text-sm tracking-widest rounded-xl shadow-glow-sm transition-all"
              disabled={
                isLoading ||
                (mode === "signup" && (!ageConfirmed || !termsConfirmed))
              }
            >
              {isLoading
                ? "Carregando..."
                : mode === "login"
                  ? "Entrar Agora"
                  : mode === "signup"
                    ? "Criar Conta"
                    : "Enviar Email de Recuperação"}
            </Button>
          </form>

          {mode === "forgot-password" ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className="text-primary hover:underline font-bold text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar para Login
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    handleModeSwitch(mode === "login" ? "signup" : "login")
                  }
                  className="text-primary hover:underline font-bold"
                >
                  {mode === "login" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-glow-sm" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
