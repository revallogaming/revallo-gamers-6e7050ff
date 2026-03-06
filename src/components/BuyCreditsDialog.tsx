"use client";

import { useState } from "react";
import {
  Coins,
  Sparkles,
  QrCode,
  Copy,
  Check,
  ArrowLeft,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCredits, CREDIT_PACKAGES } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

export function BuyCreditsDialog() {
  const { createPixPayment } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<
    (typeof CREDIT_PACKAGES)[0] | null
  >(null);
  const [paymentData, setPaymentData] = useState<{
    qr_code: string;
    qr_code_base64: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBuy = async () => {
    if (!selectedPackage) return;
    const result = await createPixPayment.mutateAsync({
      amountBrl: selectedPackage.brl,
      creditsAmount: selectedPackage.credits,
    });
    if (result) {
      setPaymentData({
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64,
      });
    }
  };

  const handleCopy = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setSelectedPackage(null);
    setPaymentData(null);
    setCopied(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest text-[11px] px-8 rounded-none shadow-lg shadow-primary/20 gap-2">
          <Coins className="h-4 w-4" />
          Comprar Créditos
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-[#0D0B1A] border-white/5 text-white rounded-none p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              {paymentData ? "Pagar com PIX" : "Comprar Créditos REV"}
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic mt-1">
              {paymentData
                ? "Escaneie o QR Code ou copie o código PIX"
                : "Selecione o pacote e gere o pagamento via PIX"}
            </p>
          </DialogHeader>
        </div>

        <div className="px-8 py-6">
          {!paymentData ? (
            <div className="space-y-6">
              {/* Packages Grid */}
              <div className="grid grid-cols-3 gap-3">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.brl}
                    onClick={() => setSelectedPackage(pkg)}
                    className={cn(
                      "relative p-4 border text-center transition-all group overflow-hidden",
                      selectedPackage?.brl === pkg.brl
                        ? "border-primary bg-primary/10"
                        : "border-white/5 bg-white/2 hover:border-primary/40"
                    )}
                  >
                    {pkg.bonus > 0 && (
                      <span className="absolute top-0 right-0 bg-amber-500 text-[8px] font-black px-2 py-0.5 text-black italic uppercase">
                        +{pkg.bonus} bônus
                      </span>
                    )}
                    <p className="text-xl font-black italic text-white">
                      R$ {pkg.brl}
                    </p>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">
                      {pkg.credits} REV
                    </p>
                  </button>
                ))}
              </div>

              {/* Selected Summary */}
              {selectedPackage && (
                <div className="p-4 bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                      Selecionado
                    </p>
                    <p className="text-lg font-black italic text-white">
                      {selectedPackage.credits + selectedPackage.bonus} REV
                      {selectedPackage.bonus > 0 && (
                        <span className="ml-2 text-amber-500 text-sm">
                          <Sparkles className="inline h-3 w-3 mr-1" />
                          +{selectedPackage.bonus} bônus
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-3xl font-black italic text-primary">
                    R$ {selectedPackage.brl}
                  </p>
                </div>
              )}

              <Button
                className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-none font-black uppercase italic tracking-widest text-xs disabled:opacity-40"
                disabled={!selectedPackage || createPixPayment.isPending}
                onClick={handleBuy}
              >
                {createPixPayment.isPending
                  ? "Gerando PIX..."
                  : "Gerar QR Code PIX"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white/2 border border-white/5">
                {paymentData.qr_code_base64 ? (
                  <img
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center border border-white/10">
                    <QrCode className="h-16 w-16 text-gray-700" />
                  </div>
                )}
              </div>

              {/* Copy Code */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
                  Código PIX — Copia e Cola
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentData.qr_code || ""}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-xs text-gray-400 font-mono truncate"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="border-white/10 rounded-none bg-white/2 hover:bg-white/5 text-white px-4"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-center text-[10px] font-black uppercase tracking-widest italic text-gray-600">
                Créditos liberados automaticamente após confirmação do pagamento
              </p>

              <Button
                variant="ghost"
                onClick={reset}
                className="w-full text-[10px] font-black uppercase italic tracking-widest text-gray-600 hover:text-white gap-2"
              >
                <ArrowLeft className="h-3 w-3" /> Escolher outro pacote
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
