import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MiniTournament } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, QrCode } from 'lucide-react';

interface Props {
  tournament: MiniTournament;
  onSuccess: () => void;
  children?: React.ReactNode;
}

export function PrizeDepositDialog({ tournament, onSuccess, children }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-prize-deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            tournament_id: tournament.id,
            amount_brl: tournament.prize_pool_brl,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar depósito');
      }

      setQrCode(result.qr_code);
      setQrCodeBase64(result.qr_code_base64);
      toast.success('QR Code PIX gerado! Escaneie para depositar.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar depósito';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast.success('Código PIX copiado!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <QrCode className="h-4 w-4" />
            Depositar Premiação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Depositar Premiação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Valor a depositar</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {tournament.prize_pool_brl.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {qrCodeBase64 ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Escaneie o QR Code com o app do seu banco
              </p>
              <Button onClick={handleCopyCode} variant="outline" className="w-full">
                Copiar Código PIX
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Após o pagamento, o torneio será publicado automaticamente.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Para publicar seu torneio, você precisa depositar o valor da premiação.
                O valor ficará retido até a conclusão do torneio, quando será distribuído
                automaticamente para os vencedores.
              </p>
              <Button 
                onClick={handleDeposit} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar QR Code PIX
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
