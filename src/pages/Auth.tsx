import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup" | "forgot-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showPasswordResetSent, setShowPasswordResetSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            toast({ 
              title: "Email não confirmado", 
              description: "Por favor, verifique seu email e clique no link de confirmação.",
              variant: "destructive" 
            });
          } else {
            throw error;
          }
        } else {
          toast({ title: "Bem-vindo de volta!" });
          navigate("/");
        }
      } else if (mode === "signup") {
        if (!nickname.trim()) {
          toast({ title: "Digite um nickname", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, nickname);
        if (error) throw error;
        
        setShowEmailConfirmation(true);
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        
        setShowPasswordResetSent(true);
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      }
      
      toast({ 
        title: mode === "login" ? "Erro ao entrar" : mode === "signup" ? "Erro ao criar conta" : "Erro ao enviar email", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset email sent screen
  if (showPasswordResetSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="font-display text-2xl text-foreground">
              Email Enviado!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Enviamos um link de recuperação para:
              </p>
              <p className="font-semibold text-foreground text-lg">
                {email}
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                📧 Clique no link enviado para redefinir sua senha.
              </p>
              <p className="text-sm text-muted-foreground">
                Não recebeu? Verifique a pasta de spam.
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowPasswordResetSent(false);
                setMode("login");
                setPassword("");
              }}
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Email confirmation success screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="font-display text-2xl text-foreground">
              Verifique seu Email
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Enviamos um link de confirmação para:
              </p>
              <p className="font-semibold text-foreground text-lg">
                {email}
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                📧 Clique no link enviado para seu email para ativar sua conta.
              </p>
              <p className="text-sm text-muted-foreground">
                Não recebeu? Verifique a pasta de spam.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleResendConfirmation}
                disabled={isLoading}
              >
                {isLoading ? "Reenviando..." : "Reenviar Email de Confirmação"}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setMode("login");
                  setPassword("");
                }}
              >
                Voltar para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form
  if (mode === "forgot-password") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
              <Gamepad2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-3xl">
              <span className="text-gradient-primary">REVALLO</span>
            </CardTitle>
            <p className="text-muted-foreground">
              Recuperar sua senha
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 font-semibold text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
      
      <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-3xl">
            <span className="text-gradient-primary">REVALLO</span>
          </CardTitle>
          <p className="text-muted-foreground">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-foreground">Nickname</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    placeholder="Seu nome de jogador"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-border"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 font-semibold text-lg py-6"
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "login" ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
