import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface JoinTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: any;
  userId: string;
}

export function JoinTournamentDialog({
  open,
  onOpenChange,
  tournament,
  userId,
}: JoinTournamentDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: tournament.id,
          player_id: userId,
          participant_email: email.trim(),
        });

      if (error) throw error;

      // Send confirmation email with tournament details
      try {
        await supabase.functions.invoke("send-tournament-email", {
          body: {
            type: "registration",
            email: email.trim(),
            tournamentTitle: tournament.title,
            tournamentLink: tournament.tournament_link,
            startDate: tournament.start_date,
            entryFee: tournament.entry_fee,
          },
        });
      } catch (emailError) {
        console.log("Email notification not sent:", emailError);
      }

      toast.success("Inscrição realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournament", tournament.id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["participants", tournament.id] });
      onOpenChange(false);
      setEmail("");
    } catch (error: any) {
      console.error("Error joining tournament:", error);
      toast.error(error.message || "Erro ao realizar inscrição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-b from-card to-background border-border/50">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="font-display text-xl text-gradient-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Inscrição no Torneio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe seu email para receber as informações do torneio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
            <h3 className="font-medium text-foreground">{tournament?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tournament?.entry_fee > 0
                ? `Inscrição: R$ ${(tournament.entry_fee / 100).toFixed(2).replace('.', ',')}`
                : "Inscrição Gratuita"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Seu Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12 bg-muted/30 border-border/50"
              required
            />
            <p className="text-xs text-muted-foreground">
              Você receberá as informações e link do torneio neste email
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscrevendo...
                </>
              ) : (
                "Confirmar Inscrição"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
