import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Coins, Trophy, Edit, Save, X, Gamepad2, Camera, Loader2, Copy, CheckCircle } from "lucide-react";
import { GAME_INFO, GameType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Profile = () => {
  const { user, profile, refreshProfile, hasRole } = useAuth();
  const { transactions, payments } = useCredits();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [mainGame, setMainGame] = useState<GameType | "">(profile?.main_game || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyProfileLink = () => {
    if (user) {
      const url = `${window.location.origin}/profile/${user.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link do perfil copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast({ title: "Nickname é obrigatório", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim(),
          bio: bio.trim() || null,
          main_game: mainGame || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast({ title: "Perfil atualizado!" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setNickname(profile?.nickname || "");
    setBio(profile?.bio || "");
    setMainGame(profile?.main_game || "");
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB", variant: "destructive" });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: "Foto atualizada!" });
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar with upload button */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-primary/50 glow-primary">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {profile?.nickname?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="mt-4 w-full space-y-4">
                    <div>
                      <Label>Nickname</Label>
                      <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Conte um pouco sobre você..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Jogo Principal</Label>
                      <Select value={mainGame} onValueChange={(v) => setMainGame(v as GameType)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione um jogo" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(GAME_INFO) as GameType[]).map((game) => (
                            <SelectItem key={game} value={game}>
                              {GAME_INFO[game].icon} {GAME_INFO[game].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                      {profile?.nickname}
                    </h2>
                    {profile?.main_game && (
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <span>{GAME_INFO[profile.main_game].icon}</span>
                        <span>{GAME_INFO[profile.main_game].name}</span>
                      </div>
                    )}
                    {profile?.bio && (
                      <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={copyProfileLink}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Link do Perfil
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {/* Credits Display */}
                <div className="mt-6 w-full rounded-lg border border-accent/30 bg-accent/10 p-4">
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <Coins className="h-5 w-5" />
                    <span className="text-2xl font-bold">{profile?.credits ?? 0}</span>
                    <span className="text-sm">créditos</span>
                  </div>
                  <div className="mt-3">
                    <BuyCreditsDialog />
                  </div>
                </div>

                {/* Roles */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {hasRole("player") && (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">
                      <Gamepad2 className="inline mr-1 h-3 w-3" />
                      Jogador
                    </span>
                  )}
                  {hasRole("organizer") && (
                    <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs text-secondary">
                      <Trophy className="inline mr-1 h-3 w-3" />
                      Organizador
                    </span>
                  )}
                  {hasRole("admin") && (
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="transactions">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="transactions">Transações</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos PIX</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transactions" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-accent" />
                      Histórico de Créditos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions?.length ? (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {tx.description || tx.type}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <span
                              className={`font-bold ${
                                tx.amount > 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {tx.amount > 0 ? "+" : ""}
                              {tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payments" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-accent" />
                      Pagamentos PIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {payments?.length ? (
                      <div className="space-y-3">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                R$ {Number(payment.amount_brl).toFixed(2)} → {payment.credits_amount} créditos
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                payment.status === "confirmed"
                                  ? "bg-green-500/20 text-green-500"
                                  : payment.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {payment.status === "confirmed"
                                ? "Confirmado"
                                : payment.status === "pending"
                                ? "Pendente"
                                : "Falhou"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum pagamento encontrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
