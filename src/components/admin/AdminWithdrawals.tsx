import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_nickname: string;
  amount_credits: number;
  pix_key: string;
  pix_key_type: string;
  status: "pending" | "completed" | "cancelled";
  created_at: Timestamp;
}

export function AdminWithdrawals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "withdrawal_requests"),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WithdrawalRequest[];
      setRequests(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.error("Erro ao carregar pedidos de saque");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: "completed" | "cancelled",
  ) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, "withdrawal_requests", requestId), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      toast.success(
        `Saque marcado como ${newStatus === "completed" ? "concluído" : "cancelado"}`,
      );
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-display font-bold">
          Pedidos de Saque Pix
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Chave Pix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Nenhum pedido de saque encontrado
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{req.user_nickname}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {req.user_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-bold">
                        {req.amount_credits} Pts
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        R$ {req.amount_credits.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {req.pix_key}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(req.pix_key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {req.pix_key_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Badge
                          variant="outline"
                          className="text-amber-500 border-amber-500/20 bg-amber-500/5 gap-1"
                        >
                          <Clock className="h-3 w-3" /> PENDENTE
                        </Badge>
                      )}
                      {req.status === "completed" && (
                        <Badge
                          variant="outline"
                          className="text-green-500 border-green-500/20 bg-green-500/5 gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> CONCLUÍDO
                        </Badge>
                      )}
                      {req.status === "cancelled" && (
                        <Badge
                          variant="outline"
                          className="text-red-500 border-red-500/20 bg-red-500/5 gap-1"
                        >
                          <XCircle className="h-3 w-3" /> CANCELADO
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.created_at &&
                        format(req.created_at.toDate(), "dd/MM/yy HH:mm", {
                          locale: ptBR,
                        })}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                            onClick={() =>
                              handleUpdateStatus(req.id, "cancelled")
                            }
                            disabled={!!processing}
                          >
                            Recusar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                              handleUpdateStatus(req.id, "completed")
                            }
                            disabled={!!processing}
                          >
                            Concluir
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
