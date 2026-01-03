import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, CREDIT_PACKAGES } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Sparkles, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Credits = () => {
  const { user, profile } = useAuth();
  const { transactions, payments } = useCredits();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Calculate stats
  const totalDeposited = payments?.filter(p => p.status === "confirmed")
    .reduce((acc, p) => acc + p.credits_amount, 0) ?? 0;
  const totalSpent = transactions?.filter(t => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Meus Créditos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus créditos e faça depósitos via PIX
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-accent/20 p-3">
                  <Coins className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Atual</p>
                  <p className="text-3xl font-bold text-foreground">{profile?.credits ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <ArrowDownLeft className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Depositado</p>
                  <p className="text-3xl font-bold text-foreground">{totalDeposited}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <ArrowUpRight className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-3xl font-bold text-foreground">{totalSpent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Buy Credits Section */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Comprar Créditos via PIX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.brl}
                  className="rounded-xl border border-border/50 bg-background/50 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-foreground">R$ {pkg.brl}</p>
                  <p className="text-lg font-semibold text-accent">{pkg.credits} créditos</p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-secondary flex items-center justify-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3" />
                      +{pkg.bonus} bônus
                    </p>
                  )}
                </div>
              ))}
            </div>
            <BuyCreditsDialog />
          </CardContent>
        </Card>
        
        {/* Transaction History */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Histórico de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          tx.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                      >
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-lg font-bold ${
                        tx.amount > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm mt-2">Faça seu primeiro depósito via PIX!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Credits;
