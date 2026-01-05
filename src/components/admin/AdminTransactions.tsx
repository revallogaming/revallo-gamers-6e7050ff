import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, ArrowUpRight, ArrowDownLeft, Coins, FileDown, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { exportTransactionsToPDF, exportTransactionsToExcel } from "@/lib/exportUtils";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  nickname?: string;
}

export function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (transactionsError) throw transactionsError;

      // Get unique user IDs
      const userIds = [...new Set(transactionsData?.map(t => t.user_id) || [])];
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.nickname]) || []);

      return (transactionsData || []).map(t => ({
        ...t,
        nickname: profileMap.get(t.user_id) || 'Usuário desconhecido'
      }));
    }
  });

  const filteredTransactions = transactions.filter(t =>
    t.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pix_purchase': { label: 'Compra PIX', variant: 'default' },
      'admin_add': { label: 'Admin +', variant: 'default' },
      'admin_remove': { label: 'Admin -', variant: 'destructive' },
      'admin_set': { label: 'Admin Set', variant: 'secondary' },
      'mini_tournament_entry': { label: 'Entrada Mini', variant: 'destructive' },
      'prize_win': { label: 'Prêmio', variant: 'default' }
    };
    return types[type] || { label: type, variant: 'outline' as const };
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Transações de Créditos
            </CardTitle>
            <CardDescription>
              Histórico de todas as transações de créditos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportTransactionsToPDF(filteredTransactions)}
              disabled={filteredTransactions.length === 0}
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportTransactionsToExcel(filteredTransactions)}
              disabled={filteredTransactions.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => {
                  const typeInfo = getTypeLabel(t.type);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nickname}</TableCell>
                      <TableCell>
                        <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 font-mono font-bold ${
                          t.amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {t.amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                          {Math.abs(t.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {t.description || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(t.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
