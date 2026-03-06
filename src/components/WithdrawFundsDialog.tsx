import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useUserPixKey } from "@/hooks/useUserPixKey";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function WithdrawFundsDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const { spendCredits } = useCredits();
  const { pixKey } = useUserPixKey();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState<string>("");

  const userCredits = profile?.credits || 0;
  // Conversion: 1 credit = 1 BRL (adjust as per project rules)
  // The user rule implies credits are purchased with BRL 1:1 roughly
  const numericAmount = parseInt(amount) || 0;

  const handleWithdraw = async () => {
    if (!user || !profile) return;

    if (numericAmount < 10) {
      toast.error("O valor mínimo para saque é de 10 créditos.");
      return;
    }

    if (numericAmount > userCredits) {
      toast.error("Saldo insuficiente.");
      return;
    }

    if (!pixKey?.pix_key) {
      toast.error("Você precisa configurar sua chave Pix no perfil primeiro.");
      return;
    }

    setLoading(true);

    try {
      // 1. Deduct credits
      await spendCredits.mutateAsync({
        amount: numericAmount,
        type: "withdrawal",
        description: "Pedido de saque Pix",
        referenceId: "pending",
      });

      // 2. Create withdrawal request
      await addDoc(collection(db, "withdrawal_requests"), {
        user_id: user.uid,
        user_nickname: profile.nickname,
        amount_credits: numericAmount,
        pix_key: pixKey.pix_key,
        pix_key_type: pixKey.pix_key_type,
        status: "pending",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setSuccess(true);
      toast.success("Pedido de saque enviado!");
    } catch (error) {
      console.error("Error withrawing:", error);
      toast.error("Erro ao processar saque. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    // Reset state after a delay to allow animation
    setTimeout(() => {
      setSuccess(false);
      setAmount("");
    }, 300);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-[#0D0D0F] border-white/5 rounded-[32px] p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
              Pedido Enviado!
            </h2>
            <p className="text-gray-500 text-sm mb-8 font-medium">
              Seu pedido de saque de{" "}
              <span className="text-white font-bold">
                {numericAmount} créditos
              </span>{" "}
              foi recebido e será processado em até 24h.
            </p>
            <Button
              onClick={closeDialog}
              className="w-full bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 font-bold uppercase tracking-widest text-xs"
            >
              FECHAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="gap-2 rounded-2xl border-white/10 hover:bg-white/5"
          >
            <Wallet className="h-4 w-4" />
            Sacar Créditos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[#0D0D0F] border-white/5 rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white mb-1">
            Solicitar Saque
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-medium pb-4">
            Transforme seus créditos em dinheiro real via Pix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                Saldo Disponível
              </span>
            </div>
            <span className="text-xl font-black italic text-white">
              {userCredits}
            </span>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
              VALOR PARA SAQUE (CRÉDITOS)
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Mínimo 10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-lg font-bold text-white focus:border-primary/50"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-primary font-black italic">
                CRES
              </div>
            </div>
          </div>

          {!pixKey?.pix_key ? (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-red-500">
                  Chave Pix não configurada
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Vá até as configurações do seu perfil para cadastrar uma chave
                  Pix para recebimento.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-green-500">
                  Chave Pix configurada
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Seu saque será enviado para:{" "}
                  <span className="text-white font-bold">{pixKey.pix_key}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-8">
          <Button
            onClick={handleWithdraw}
            disabled={
              loading ||
              !amount ||
              numericAmount < 10 ||
              numericAmount > userCredits ||
              !pixKey?.pix_key
            }
            className="w-full bg-primary hover:bg-primary/90 text-white font-black italic uppercase rounded-2xl h-14 text-sm tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                CONFIRMAR SAQUE <ArrowUpRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
