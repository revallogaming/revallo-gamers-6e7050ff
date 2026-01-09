import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

type AuthMode = "login" | "signup" | "forgot-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showPasswordResetSent, setShowPasswordResetSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao entrar com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        if (!ageConfirmed) {
          toast({ title: "Confirme que você tem 18 anos ou autorização do responsável", variant: "destructive" });
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
            
            {mode === "signup" && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Checkbox
                  id="age-confirmation"
                  checked={ageConfirmed}
                  onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor="age-confirmation" 
                  className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                >
                  Declaro que tenho 18 anos ou mais, ou que possuo autorização do meu responsável legal para utilizar a Revallo. Ao criar minha conta, concordo com os{" "}
                  <Link to="/termos-de-uso" className="text-primary hover:underline" target="_blank">
                    Termos de Uso
                  </Link>.
                </label>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 font-semibold text-lg py-6"
              disabled={isLoading || (mode === "signup" && !ageConfirmed)}
            >
              {isLoading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full py-6 text-base font-medium"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            <span className="ml-2">Google</span>
          </Button>
          
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
