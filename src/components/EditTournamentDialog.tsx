import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GameType, GAME_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeExternalUrl } from "@/lib/links";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon, Save, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTournamentDialogProps {
  tournament: any;
  children: React.ReactNode;
}

export function EditTournamentDialog({ tournament, children }: EditTournamentDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "" as GameType | "",
    rules: "",
    prize_description: "",
    entry_fee: 0,
    max_participants: 100,
    start_date: null as Date | null,
    end_date: null as Date | null,
    registration_deadline: null as Date | null,
    tournament_link: "",
  });

  useEffect(() => {
    if (tournament && open) {
      setFormData({
        title: tournament.title || "",
        description: tournament.description || "",
        game: tournament.game || "",
        rules: tournament.rules || "",
        prize_description: tournament.prize_description || "",
        entry_fee: tournament.entry_fee ? tournament.entry_fee / 100 : 0,
        max_participants: tournament.max_participants || 100,
        start_date: tournament.start_date ? new Date(tournament.start_date) : null,
        end_date: tournament.end_date ? new Date(tournament.end_date) : null,
        registration_deadline: tournament.registration_deadline ? new Date(tournament.registration_deadline) : null,
        tournament_link: tournament.tournament_link || "",
      });
    }
  }, [tournament, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.game) {
      toast.error("Selecione um jogo");
      return;
    }

    const tournamentLink = normalizeExternalUrl(formData.tournament_link);
    if (formData.tournament_link.trim() && !tournamentLink) {
      toast.error("Link do torneio inválido. Use um link completo (https://...)");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          title: formData.title,
          description: formData.description || null,
          game: formData.game as GameType,
          rules: formData.rules || null,
          prize_description: formData.prize_description || null,
          entry_fee: Math.round(formData.entry_fee * 100),
          max_participants: formData.max_participants,
          start_date: formData.start_date?.toISOString() || "",
          end_date: formData.end_date?.toISOString() || null,
          registration_deadline: formData.registration_deadline?.toISOString() || "",
          tournament_link: tournamentLink,
        })
        .eq("id", tournament.id);

      if (error) throw error;

      toast.success("Torneio atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["my-created-tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournament.id] });
      setOpen(false);
    } catch (error: any) {
      console.error("Error updating tournament:", error);
      toast.error(error.message || "Erro ao atualizar torneio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-card to-background border-border/50">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="font-display text-2xl text-gradient-primary">Editar Torneio</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Atualize as informações do seu torneio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        {GAME_INFO[game].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournament_link" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link do Torneio (Discord, WhatsApp, etc)
              </Label>
              <Input
                id="tournament_link"
                type="url"
                value={formData.tournament_link}
                onChange={(e) => setFormData({ ...formData, tournament_link: e.target.value })}
                placeholder="https://discord.gg/... ou https://chat.whatsapp.com/..."
              />
            </div>
          </div>

          {/* Financial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_fee">Valor da Inscrição (R$)</Label>
              <Input
                id="entry_fee"
                type="number"
                min={0}
                step="0.01"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prize_description">Premiação</Label>
              <Input
                id="prize_description"
                value={formData.prize_description}
                onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Máx. Participantes</Label>
              <Input
                id="max_participants"
                type="number"
                min={2}
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fim das Inscrições *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.registration_deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.registration_deadline
                      ? format(formData.registration_deadline, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.registration_deadline || undefined}
                    onSelect={(date) => setFormData({ ...formData, registration_deadline: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date
                      ? format(formData.start_date, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date
                      ? format(formData.end_date, "dd/MM/yyyy", { locale: ptBR })
                      : "Opcional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Regras</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:opacity-90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
