import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GameType, GAME_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Loader2, Image as ImageIcon, Star, Coins, CalendarIcon, Trophy, Users, DollarSign, FileText, Key, Gamepad2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTournamentDialogProps {
  children?: React.ReactNode;
}

// Boost packages: credits -> days highlighted
const BOOST_PACKAGES = [
  { credits: 50, days: 1, label: "1 dia" },
  { credits: 100, days: 3, label: "3 dias" },
  { credits: 200, days: 7, label: "7 dias" },
  { credits: 400, days: 14, label: "14 dias" },
];

export function CreateTournamentDialog({ children }: CreateTournamentDialogProps) {
  const { user } = useAuth();
  const { credits, spendCredits } = useCredits();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [enableBoost, setEnableBoost] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState(0);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "" as GameType | "",
    rules: "",
    prize_amount: 0,
    entry_fee_brl: 0,
    max_participants: 100,
    start_date: null as Date | null,
    end_date: null as Date | null,
    registration_deadline: null as Date | null,
    organizer_pix_key: "",
    tournament_link: "",
  });

  const selectedBoostPackage = BOOST_PACKAGES[selectedBoost];
  const hasEnoughCredits = credits >= (selectedBoostPackage?.credits || 0);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile || !user) return null;

    const fileExt = bannerFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, bannerFile);

    if (error) {
      console.error("Error uploading banner:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para criar um torneio");
      return;
    }

    if (!formData.game) {
      toast.error("Selecione um jogo");
      return;
    }

    if (!formData.organizer_pix_key) {
      toast.error("Informe sua chave PIX para receber os pagamentos");
      return;
    }

    // Check credits for boost
    if (enableBoost && !hasEnoughCredits) {
      toast.error("Créditos insuficientes para impulsionar o torneio");
      return;
    }

    setLoading(true);

    try {
      // Upload banner if exists
      let bannerUrl = null;
      if (bannerFile) {
        bannerUrl = await uploadBanner();
      }

      // Calculate highlighted_until if boost is enabled
      let highlightedUntil = null;
      let isHighlighted = false;
      
      if (enableBoost && selectedBoostPackage) {
        const boostEndDate = new Date();
        boostEndDate.setDate(boostEndDate.getDate() + selectedBoostPackage.days);
        highlightedUntil = boostEndDate.toISOString();
        isHighlighted = true;
      }

      // Format prize description from amount
      const prizeDescription = formData.prize_amount > 0 
        ? `Premiação total: R$ ${formData.prize_amount.toFixed(2).replace('.', ',')}`
        : null;

      // Create tournament
      const { data: tournament, error } = await supabase
        .from("tournaments")
        .insert({
          organizer_id: user.id,
          title: formData.title,
          description: formData.description || null,
          game: formData.game as GameType,
          rules: formData.rules || null,
          prize_description: prizeDescription,
          entry_fee: Math.round(formData.entry_fee_brl * 100), // Store as centavos for precision
          max_participants: formData.max_participants,
          start_date: formData.start_date?.toISOString() || "",
          end_date: formData.end_date?.toISOString() || null,
          registration_deadline: formData.registration_deadline?.toISOString() || "",
          banner_url: bannerUrl,
          status: "upcoming",
          is_highlighted: isHighlighted,
          highlighted_until: highlightedUntil,
          tournament_link: formData.tournament_link || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Spend credits for boost if enabled
      if (enableBoost && selectedBoostPackage) {
        await spendCredits.mutateAsync({
          amount: selectedBoostPackage.credits,
          type: "tournament_boost",
          description: `Impulso de torneio: ${formData.title} (${selectedBoostPackage.label})`,
          referenceId: tournament.id,
        });
      }

      // Save PIX key in separate secure table
      const { error: pixError } = await supabase
        .from("organizer_payment_info")
        .upsert({
          organizer_id: user.id,
          pix_key: formData.organizer_pix_key,
        }, { onConflict: 'organizer_id' });

      if (pixError) {
        console.error("Error saving PIX key:", pixError);
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-tournament-email", {
          body: {
            tournamentId: tournament.id,
            email: user.email,
            tournamentTitle: formData.title,
            game: GAME_INFO[formData.game as GameType].name,
            startDate: formData.start_date?.toISOString() || "",
            entryFee: formData.entry_fee_brl,
            maxParticipants: formData.max_participants,
            prizeDescription: prizeDescription,
            pixKey: formData.organizer_pix_key,
          },
        });
      } catch (emailError) {
        console.log("Email not sent:", emailError);
      }

      toast.success("Torneio criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      toast.error(error.message || "Erro ao criar torneio");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      game: "",
      rules: "",
      prize_amount: 0,
      entry_fee_brl: 0,
      max_participants: 100,
      start_date: null,
      end_date: null,
      registration_deadline: null,
      organizer_pix_key: "",
      tournament_link: "",
    });
    setBannerFile(null);
    setBannerPreview(null);
    setEnableBoost(false);
    setSelectedBoost(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Criar Torneio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-card to-background border-border/50">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="font-display text-2xl text-gradient-primary">Criar Novo Torneio</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preencha os dados do torneio. 5% do valor de cada inscrição será retido como taxa da plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Banner Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-display text-secondary">
              <ImageIcon className="h-4 w-4" />
              <span>Banner do Torneio</span>
            </div>
            <div 
              className="relative border-2 border-dashed border-border/50 rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {bannerPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium bg-primary/80 px-4 py-2 rounded-full">Alterar Banner</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Clique para adicionar banner</span>
                  <span className="text-xs mt-1 text-muted-foreground/70">Recomendado: 1920x1080</span>
                </div>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Title and Game Section */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-sm font-display text-primary">
              <Gamepad2 className="h-4 w-4" />
              <span>Informações Básicas</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-muted-foreground">Título do Torneio *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Copa Free Fire 2026"
                  className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game" className="text-xs text-muted-foreground">Jogo *</Label>
                <Select
                  value={formData.game}
                  onValueChange={(value) => setFormData({ ...formData, game: value as GameType })}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-border/50">
                    <SelectValue placeholder="Selecione o jogo" />
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
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva seu torneio..."
                className="min-h-[80px] bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Financial Section */}
          <div className="space-y-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 text-sm font-display text-accent">
              <DollarSign className="h-4 w-4" />
              <span>Configurações Financeiras</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry_fee_brl" className="text-xs text-muted-foreground">Valor da Inscrição *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold">R$</span>
                  <Input
                    id="entry_fee_brl"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.entry_fee_brl}
                    onChange={(e) => setFormData({ ...formData, entry_fee_brl: parseFloat(e.target.value) || 0 })}
                    className="pl-10 h-12 bg-muted/30 border-border/50 focus:border-accent/50"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Taxa: 5% • Você recebe 95%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize_amount" className="text-xs text-muted-foreground">Premiação Total</Label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                  <Input
                    id="prize_amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.prize_amount}
                    onChange={(e) => setFormData({ ...formData, prize_amount: parseFloat(e.target.value) || 0 })}
                    className="pl-10 h-12 bg-muted/30 border-border/50 focus:border-accent/50"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_participants" className="text-xs text-muted-foreground">Máx. Participantes *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                  <Input
                    id="max_participants"
                    type="number"
                    min={2}
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
                    className="pl-10 h-12 bg-muted/30 border-border/50 focus:border-secondary/50"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates - Styled Date Pickers */}
          <div className="space-y-4 p-4 rounded-xl bg-secondary/5 border border-secondary/20">
            <div className="flex items-center gap-2 text-sm font-display text-secondary">
              <CalendarIcon className="h-4 w-4" />
              <span>Datas do Torneio</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fim das Inscrições *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 border-border/50 bg-muted/30 hover:bg-secondary/10 hover:border-secondary/50 transition-all",
                        !formData.registration_deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-destructive" />
                      {formData.registration_deadline ? (
                        <span className="font-medium">{format(formData.registration_deadline, "dd 'de' MMM", { locale: ptBR })}</span>
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.registration_deadline || undefined}
                      onSelect={(date) => setFormData({ ...formData, registration_deadline: date || null })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data de Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 border-border/50 bg-muted/30 hover:bg-secondary/10 hover:border-secondary/50 transition-all",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-secondary" />
                      {formData.start_date ? (
                        <span className="font-medium">{format(formData.start_date, "dd 'de' MMM", { locale: ptBR })}</span>
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 border-border/50 bg-muted/30 hover:bg-secondary/10 hover:border-secondary/50 transition-all",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                      {formData.end_date ? (
                        <span className="font-medium">{format(formData.end_date, "dd 'de' MMM", { locale: ptBR })}</span>
                      ) : (
                        <span>Opcional</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                      disabled={(date) => formData.start_date ? date < formData.start_date : date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Rules and PIX Section */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-sm font-display text-primary">
              <FileText className="h-4 w-4" />
              <span>Regras e Pagamento</span>
            </div>
            
            {/* Rules */}
            <div className="space-y-2">
              <Label htmlFor="rules" className="text-xs text-muted-foreground">Regras do Torneio</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Descreva as regras do torneio..."
                className="min-h-[100px] bg-muted/30 border-border/50 focus:border-primary/50"
              />
            </div>

            {/* Tournament Link */}
            <div className="space-y-2">
              <Label htmlFor="tournament_link" className="text-xs text-muted-foreground flex items-center gap-2">
                <LinkIcon className="h-3 w-3" />
                Link do Torneio (Discord, WhatsApp, etc)
              </Label>
              <Input
                id="tournament_link"
                type="url"
                value={formData.tournament_link}
                onChange={(e) => setFormData({ ...formData, tournament_link: e.target.value })}
                placeholder="https://discord.gg/... ou https://chat.whatsapp.com/..."
                className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground/70">
                Este link será enviado aos participantes inscritos
              </p>
            </div>

            {/* PIX Key */}
            <div className="space-y-2">
              <Label htmlFor="organizer_pix_key" className="text-xs text-muted-foreground flex items-center gap-2">
                <Key className="h-3 w-3" />
                Chave PIX para Recebimento *
              </Label>
              <Input
                id="organizer_pix_key"
                value={formData.organizer_pix_key}
                onChange={(e) => setFormData({ ...formData, organizer_pix_key: e.target.value })}
                placeholder="CPF, Email, Telefone ou Chave Aleatória"
                className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                required
              />
              <p className="text-xs text-muted-foreground/70">
                Você receberá 95% do valor de cada inscrição nesta chave
              </p>
            </div>
          </div>

          {/* Boost Section */}
          <div className="space-y-4 p-4 rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <Label htmlFor="boost-toggle" className="text-base font-display font-semibold cursor-pointer text-accent">
                    Impulsionar Torneio
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Apareça na seção de destaque da página inicial
                  </p>
                </div>
              </div>
              <Switch
                id="boost-toggle"
                checked={enableBoost}
                onCheckedChange={setEnableBoost}
              />
            </div>

            {enableBoost && (
              <div className="space-y-4 pt-2 relative z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg w-fit">
                  <Coins className="h-4 w-4 text-accent" />
                  <span>Seus créditos: <strong className="text-accent">{credits}</strong></span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {BOOST_PACKAGES.map((pkg, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedBoost(index)}
                      className={`p-4 rounded-xl border-2 transition-all text-center relative overflow-hidden group ${
                        selectedBoost === index
                          ? "border-accent bg-accent/20 shadow-lg shadow-accent/20"
                          : "border-border/50 hover:border-accent/50 bg-muted/20"
                      } ${credits < pkg.credits ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      disabled={credits < pkg.credits}
                    >
                      {selectedBoost === index && (
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
                      )}
                      <div className="relative z-10">
                        <div className="font-display font-bold text-foreground text-lg">{pkg.label}</div>
                        <div className="text-sm text-accent font-medium">{pkg.credits} créditos</div>
                      </div>
                    </button>
                  ))}
                </div>

                {!hasEnoughCredits && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
                    Créditos insuficientes. Você precisa de {selectedBoostPackage.credits} créditos.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="px-6 border-border/50 hover:bg-muted/50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (enableBoost && !hasEnoughCredits)}
              className="px-8 bg-gradient-primary hover:opacity-90 glow-primary font-display font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : enableBoost ? (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Criar e Impulsionar
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Torneio
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
