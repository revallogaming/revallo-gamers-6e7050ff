import { useState } from 'react';
import { Coins, Sparkles, QrCode, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCredits, CREDIT_PACKAGES } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

export function BuyCreditsDialog() {
  const { createPixPayment } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null);
  const [paymentData, setPaymentData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBuy = async () => {
    if (!selectedPackage) return;
    
    const result = await createPixPayment.mutateAsync({
      amountBrl: selectedPackage.brl,
      creditsAmount: selectedPackage.credits,
    });
    
    if (result) {
      setPaymentData({ qr_code: result.qr_code, qr_code_base64: result.qr_code_base64 });
    }
  };

  const handleCopy = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetDialog = () => {
    setSelectedPackage(null);
    setPaymentData(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold gap-2">
          <Coins className="h-4 w-4" />
          Comprar Créditos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            {paymentData ? 'Pague com PIX' : 'Comprar Créditos'}
          </DialogTitle>
        </DialogHeader>

        {!paymentData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.brl}
                  className={cn(
                    'cursor-pointer transition-all border-2',
                    selectedPackage?.brl === pkg.brl
                      ? 'border-primary glow-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">R$ {pkg.brl}</p>
                    <p className="text-lg font-semibold text-accent">{pkg.credits} créditos</p>
                    {pkg.bonus > 0 && (
                      <p className="text-xs text-secondary flex items-center justify-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3" />
                        +{pkg.bonus} bônus
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Button
              className="w-full bg-gradient-primary hover:opacity-90 font-semibold"
              disabled={!selectedPackage || createPixPayment.isPending}
              onClick={handleBuy}
            >
              {createPixPayment.isPending ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {paymentData.qr_code_base64 ? (
                <img
                  src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Código PIX Copia e Cola:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentData.qr_code || ''}
                  readOnly
                  className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs truncate"
                />
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Após o pagamento, seus créditos serão liberados automaticamente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
