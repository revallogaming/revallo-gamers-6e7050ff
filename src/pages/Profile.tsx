import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";
import { EditTournamentDialog } from "@/components/EditTournamentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, Coins, Trophy, Edit, Save, X, Gamepad2, Camera, Loader2, 
  Copy, CheckCircle, Settings, Shield, Bell, LogOut, Trash2, Calendar,
  Users, ExternalLink, Wallet
} from "lucide-react";
import { GAME_INFO, GameType, STATUS_INFO } from "@/types";
import { GameIcon } from "@/components/GameIcon";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, profile, refreshProfile, hasRole, signOut } = useAuth();
  const { transactions, payments } = useCredits();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [mainGame, setMainGame] = useState<GameType | "">(profile?.main_game || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [isSavingPix, setIsSavingPix] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's created tournaments
  const { data: myTournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ["my-created-tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch organizer payment info
  const { data: paymentInfo, isLoading: loadingPaymentInfo, refetch: refetchPaymentInfo } = useQuery({
    queryKey: ["organizer-payment-info", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("organizer_payment_info")
        .select("*")
        .eq("organizer_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setPixKey(data.pix_key || "");
      }
      return data;
    },
    enabled: !!user,
  });

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

    // Validate file type (only jpg/jpeg for Instagram-like quality)
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPG ou PNG", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB for better quality)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create a canvas to resize the image to Instagram resolution (320x320 for display, stored at 640x640)
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Instagram profile photo resolution: 320x320 displayed, stored at higher res
          const size = 640; // Store at 2x for retina displays
          canvas.width = size;
          canvas.height = size;
          
          // Calculate crop to make it square (center crop)
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          resolve();
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
      });

      const fileName = `${user.id}/avatar.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

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

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;

      toast({ title: "Torneio excluído!" });
      queryClient.invalidateQueries({ queryKey: ["my-created-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSavePixKey = async () => {
    if (!user) return;
    
    setIsSavingPix(true);
    try {
      if (paymentInfo) {
        // Update existing
        const { error } = await supabase
          .from("organizer_payment_info")
          .update({ pix_key: pixKey.trim() || null })
          .eq("organizer_id", user.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("organizer_payment_info")
          .insert({ organizer_id: user.id, pix_key: pixKey.trim() || null });
        if (error) throw error;
      }
      
      await refetchPaymentInfo();
      toast({ title: "Chave PIX salva!" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingPix(false);
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
                {/* Avatar with upload button - Instagram resolution 320x320 display */}
                <div className="relative">
                  <Avatar className="h-40 w-40 border-4 border-primary/50 glow-primary">
                    <AvatarImage 
                      src={profile?.avatar_url || undefined} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/20 text-primary text-4xl font-bold">
                      {profile?.nickname?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-2 right-2 rounded-full bg-primary p-2.5 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
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
                              {GAME_INFO[game].name}
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
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    {profile?.main_game && (
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <GameIcon game={profile.main_game} className="h-4 w-4" />
                        <span>{GAME_INFO[profile.main_game].name}</span>
                      </div>
                    )}
                    {profile?.bio && (
                      <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyProfileLink}
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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

                {/* Account Options */}
                <div className="mt-6 w-full space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Conta</p>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <Link to="/my-tournaments">
                      <Trophy className="mr-2 h-4 w-4" />
                      Meus Torneios
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="tournaments">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="tournaments">Meus Torneios</TabsTrigger>
                <TabsTrigger value="transactions">Transações</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="tournaments" className="mt-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Torneios Criados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingTournaments ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : myTournaments && myTournaments.length > 0 ? (
                      <div className="space-y-3">
                        {myTournaments.map((tournament) => {
                          const statusInfo = STATUS_INFO[tournament.status as keyof typeof STATUS_INFO];
                          return (
                            <div
                              key={tournament.id}
                              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground truncate">
                                    {tournament.title}
                                  </h4>
                                  <Badge variant={statusInfo?.variant || "secondary"}>
                                    {statusInfo?.label || tournament.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <GameIcon game={tournament.game} className="h-3 w-3" />
                                    {GAME_INFO[tournament.game as GameType]?.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {tournament.current_participants}/{tournament.max_participants}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(tournament.start_date), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/tournament/${tournament.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <EditTournamentDialog tournament={tournament}>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </EditTournamentDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir torneio?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. O torneio "{tournament.title}" e todos os dados de participantes serão permanentemente excluídos.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteTournament(tournament.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground mt-2">Você ainda não criou nenhum torneio</p>
                        <Button className="mt-4" asChild>
                          <Link to="/my-tournaments">Criar Torneio</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
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

              <TabsContent value="settings" className="mt-4 space-y-4">
                {/* Organizer Payment Settings */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Recebimento de Inscrições
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure sua chave PIX para receber automaticamente 95% das inscrições dos seus torneios.
                      Os 5% restantes são retidos como taxa da plataforma.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pix-key">Chave PIX</Label>
                      <Input
                        id="pix-key"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                        disabled={loadingPaymentInfo}
                      />
                      <p className="text-xs text-muted-foreground">
                        Certifique-se de que a chave está correta. Os repasses são feitos automaticamente após cada inscrição confirmada.
                      </p>
                    </div>

                    <Button 
                      onClick={handleSavePixKey} 
                      disabled={isSavingPix || loadingPaymentInfo}
                      className="w-full sm:w-auto"
                    >
                      {isSavingPix ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Chave PIX
                        </>
                      )}
                    </Button>

                    {paymentInfo?.pix_key && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Chave PIX configurada</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Você receberá automaticamente os repasses das inscrições.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Membro desde</p>
                        <p className="text-sm text-muted-foreground">
                          {profile?.created_at && format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <hr className="border-border/50" />
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair da Conta
                    </Button>
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
