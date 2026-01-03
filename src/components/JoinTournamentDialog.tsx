import { useState, useEffect } from "react";
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
import { Loader2, Mail, Trophy, QrCode, Copy, CheckCircle, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface JoinTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: any;
  userId: string;
}

type Step = "email" | "payment" | "pending";

export function JoinTournamentDialog({
  open,
  onOpenChange,
  tournament,
  userId,
}: JoinTournamentDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("email");
      setPixData(null);
      setCopied(false);
    }
  }, [open]);

  const isPaidTournament = tournament?.entry_fee > 0;
  const entryFeeInBRL = tournament?.entry_fee ? tournament.entry_fee / 100 : 0;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }

    if (isPaidTournament) {
      // Generate PIX payment
      setLoading(true);
      try {
        // We need to create a custom PIX payment for tournament registration
        // For now, store email and proceed to payment step
        setStep("payment");
        
        // Generate PIX QR code for the entry fee
        const { data, error } = await supabase.functions.invoke("create-tournament-registration-pix", {
          body: {
            tournament_id: tournament.id,
            email: email.trim(),
            amount_brl: entryFeeInBRL,
          },
        });

        if (error) throw error;

        setPixData(data);
      } catch (error: any) {
        console.error("Error creating PIX payment:", error);
        toast.error("Erro ao gerar pagamento PIX");
        setStep("email");
      } finally {
        setLoading(false);
      }
    } else {
      // Free tournament - register directly
      await registerForTournament();
    }
  };

  const registerForTournament = async () => {
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

  const handleCopyPix = async () => {
    if (!pixData?.qr_code) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleConfirmPayment = () => {
    setStep("pending");
    toast.info("Aguardando confirmação do pagamento...");
    // In a real scenario, this would poll for payment status
    // or use webhooks. For now, we simulate waiting.
  };

  const handleBackToEmail = () => {
    setStep("email");
    setPixData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-b from-card to-background border-border/50">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="font-display text-xl text-gradient-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {step === "email" && "Inscrição no Torneio"}
            {step === "payment" && "Pagamento via PIX"}
            {step === "pending" && "Aguardando Pagamento"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === "email" && "Informe seu email para receber as informações do torneio"}
            {step === "payment" && "Escaneie o QR Code ou copie o código PIX"}
            {step === "pending" && "Seu pagamento está sendo processado"}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <h3 className="font-medium text-foreground">{tournament?.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isPaidTournament
                  ? `Inscrição: R$ ${entryFeeInBRL.toFixed(2).replace('.', ',')}`
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
                    Processando...
                  </>
                ) : isPaidTournament ? (
                  "Continuar para Pagamento"
                ) : (
                  "Confirmar Inscrição"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-center">
              <p className="text-lg font-bold text-accent">
                R$ {entryFeeInBRL.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inscrição: {tournament?.title}
              </p>
            </div>

            {pixData?.qr_code_base64 ? (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {pixData?.qr_code && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Código PIX Copia e Cola:</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.qr_code}
                    readOnly
                    className="text-xs bg-muted/30 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPix}
                    className={copied ? "bg-green-500/20 border-green-500" : ""}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Após o pagamento, sua inscrição será confirmada automaticamente
            </p>

            <div className="flex justify-between gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToEmail}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleConfirmPayment}
              >
                Já paguei
              </Button>
            </div>
          </div>
        )}

        {step === "pending" && (
          <div className="space-y-6 pt-4 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-accent/20 animate-pulse">
                <Clock className="h-12 w-12 text-accent" />
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground">Aguardando confirmação</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Assim que o pagamento for confirmado, você receberá um email com os detalhes da inscrição.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground">
                O pagamento pode levar alguns minutos para ser processado. 
                Você pode fechar esta janela - sua inscrição será confirmada automaticamente.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}