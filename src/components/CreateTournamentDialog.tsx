import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Plus, Upload, Loader2, Image as ImageIcon } from "lucide-react";

interface CreateTournamentDialogProps {
  children?: React.ReactNode;
}

export function CreateTournamentDialog({ children }: CreateTournamentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "" as GameType | "",
    rules: "",
    prize_description: "",
    entry_fee: 0,
    max_participants: 100,
    start_date: "",
    end_date: "",
    registration_deadline: "",
    organizer_pix_key: "",
  });

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

    setLoading(true);

    try {
      // Upload banner if exists
      let bannerUrl = null;
      if (bannerFile) {
        bannerUrl = await uploadBanner();
      }

      // Create tournament
      const { data: tournament, error } = await supabase
        .from("tournaments")
        .insert({
          organizer_id: user.id,
          title: formData.title,
          description: formData.description || null,
          game: formData.game as GameType,
          rules: formData.rules || null,
          prize_description: formData.prize_description || null,
          entry_fee: formData.entry_fee,
          max_participants: formData.max_participants,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          registration_deadline: formData.registration_deadline,
          banner_url: bannerUrl,
          organizer_pix_key: formData.organizer_pix_key,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-tournament-email", {
          body: {
            tournamentId: tournament.id,
            email: user.email,
            tournamentTitle: formData.title,
            game: GAME_INFO[formData.game as GameType].name,
            startDate: formData.start_date,
            entryFee: formData.entry_fee,
            maxParticipants: formData.max_participants,
            prizeDescription: formData.prize_description,
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
      prize_description: "",
      entry_fee: 0,
      max_participants: 100,
      start_date: "",
      end_date: "",
      registration_deadline: "",
      organizer_pix_key: "",
    });
    setBannerFile(null);
    setBannerPreview(null);
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
              <Label htmlFor="entry_fee">Valor da Inscrição (créditos) *</Label>
              <Input
                id="entry_fee"
                type="number"
                min={0}
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: parseInt(e.target.value) || 0 })}
                required
              />
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

          {/* Prize Description */}
          <div className="space-y-2">
            <Label htmlFor="prize_description">Premiação</Label>
            <Textarea
              id="prize_description"
              value={formData.prize_description}
              onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
              placeholder="Ex: 1º lugar: R$ 500 | 2º lugar: R$ 200 | 3º lugar: R$ 100"
              rows={2}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Fim das Inscrições *</Label>
              <Input
                id="registration_deadline"
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="datetime-local"
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

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90 glow-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
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