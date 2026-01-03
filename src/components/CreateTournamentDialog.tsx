import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GameType, GAME_INFO } from "@/types";
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
import { Plus, Loader2, Image as ImageIcon, Star, Coins } from "lucide-react";

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
    start_date: "",
    end_date: "",
    registration_deadline: "",
    organizer_pix_key: "",
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
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          registration_deadline: formData.registration_deadline,
          banner_url: bannerUrl,
          status: "upcoming",
          is_highlighted: isHighlighted,
          highlighted_until: highlightedUntil,
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
            startDate: formData.start_date,
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
      start_date: "",
      end_date: "",
      registration_deadline: "",
      organizer_pix_key: "",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Criar Novo Torneio</DialogTitle>
          <DialogDescription>
            Preencha os dados do torneio. 5% do valor de cada inscrição será retido como taxa da plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner do Torneio (Marketing)</Label>
            <div 
              className="relative border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("banner-upload")?.click()}
            >
              {bannerPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Clique para alterar</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span className="text-sm">Clique para adicionar banner</span>
                  <span className="text-xs mt-1">Recomendado: 1920x1080</span>
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

          {/* Title and Game */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Torneio *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Copa Free Fire 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="game">Jogo *</Label>
              <Select
                value={formData.game}
                onValueChange={(value) => setFormData({ ...formData, game: value as GameType })}
              >
                <SelectTrigger>
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
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva seu torneio..."
              rows={3}
            />
          </div>

          {/* Entry Fee and Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_fee_brl">Valor da Inscrição (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="entry_fee_brl"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.entry_fee_brl}
                  onChange={(e) => setFormData({ ...formData, entry_fee_brl: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa da plataforma: 5% (você receberá 95% de cada inscrição)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Máximo de Participantes *</Label>
              <Input
                id="max_participants"
                type="number"
                min={2}
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
                required
              />
            </div>
          </div>

          {/* Prize Amount */}
          <div className="space-y-2">
            <Label htmlFor="prize_amount">Premiação Total (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="prize_amount"
                type="number"
                min={0}
                step="0.01"
                value={formData.prize_amount}
                onChange={(e) => setFormData({ ...formData, prize_amount: parseFloat(e.target.value) || 0 })}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Fim das Inscrições *</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Regras do Torneio</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Descreva as regras do torneio..."
              rows={4}
            />
          </div>

          {/* PIX Key */}
          <div className="space-y-2">
            <Label htmlFor="organizer_pix_key">Chave PIX para Recebimento *</Label>
            <Input
              id="organizer_pix_key"
              value={formData.organizer_pix_key}
              onChange={(e) => setFormData({ ...formData, organizer_pix_key: e.target.value })}
              placeholder="CPF, Email, Telefone ou Chave Aleatória"
              required
            />
            <p className="text-xs text-muted-foreground">
              Esta chave será usada para enviar os pagamentos das inscrições (95% do valor)
            </p>
          </div>

          {/* Boost Section */}
          <div className="space-y-4 p-4 rounded-lg border border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-accent" />
                <div>
                  <Label htmlFor="boost-toggle" className="text-base font-semibold cursor-pointer">
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
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  <span>Seus créditos: <strong className="text-foreground">{credits}</strong></span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {BOOST_PACKAGES.map((pkg, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedBoost(index)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedBoost === index
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      } ${credits < pkg.credits ? "opacity-50" : ""}`}
                    >
                      <div className="font-bold text-foreground">{pkg.label}</div>
                      <div className="text-sm text-accent">{pkg.credits} créditos</div>
                    </button>
                  ))}
                </div>

                {!hasEnoughCredits && (
                  <p className="text-xs text-destructive">
                    Créditos insuficientes. Você precisa de {selectedBoostPackage.credits} créditos.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (enableBoost && !hasEnoughCredits)}
              className="bg-gradient-primary hover:opacity-90 glow-primary"
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
                "Criar Torneio"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
