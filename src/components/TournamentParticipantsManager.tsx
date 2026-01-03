import { useState } from "react";
import { useOrganizerParticipants, ParticipantWithEmail } from "@/hooks/useOrganizerParticipants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, Mail, Download, Search, Send, 
  Copy, CheckCircle, Star, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Props {
  tournamentId: string;
  tournamentTitle: string;
  isOrganizer: boolean;
}

export function TournamentParticipantsManager({ tournamentId, tournamentTitle, isOrganizer }: Props) {
  const { data: participants, isLoading } = useOrganizerParticipants(tournamentId, isOrganizer);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredParticipants = participants?.filter(
    (p) =>
      p.player?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.participant_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success("Email copiado!");
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const copyAllEmails = () => {
    const emails = participants
      ?.filter((p) => p.participant_email)
      .map((p) => p.participant_email)
      .join(", ");
    if (emails) {
      navigator.clipboard.writeText(emails);
      toast.success(`${participants?.filter(p => p.participant_email).length} emails copiados!`);
    }
  };

  const exportCSV = () => {
    if (!participants || participants.length === 0) {
      toast.error("Nenhum participante para exportar");
      return;
    }

    const headers = ["Posição", "Nickname", "Email", "Data de Inscrição", "Pontuação", "Colocação"];
    const rows = participants.map((p, index) => [
      index + 1,
      p.player?.nickname || "N/A",
      p.participant_email || "N/A",
      format(new Date(p.registered_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      p.score ?? "N/A",
      p.placement ?? "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participantes_${tournamentTitle.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Lista exportada com sucesso!");
  };

  const sendMassEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }

    const emails = participants
      ?.filter((p) => p.participant_email)
      .map((p) => p.participant_email) as string[];

    if (!emails || emails.length === 0) {
      toast.error("Nenhum email disponível para enviar");
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-mass-email", {
        body: {
          emails,
          subject: emailSubject,
          message: emailMessage,
          tournamentTitle,
        },
      });

      if (error) throw error;

      toast.success(`Email enviado para ${emails.length} participantes!`);
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch (error: any) {
      toast.error("Erro ao enviar emails: " + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Participantes ({participants?.length || 0})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar Email para Participantes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Assunto</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Assunto do email..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mensagem</label>
                    <Textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Escreva sua mensagem..."
                      rows={6}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este email será enviado para {participants?.filter(p => p.participant_email).length || 0} participantes.
                  </p>
                  <Button
                    onClick={sendMassEmail}
                    disabled={sendingEmail}
                    className="w-full bg-gradient-primary"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para Todos
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="gap-2" onClick={copyAllEmails}>
              <Copy className="h-4 w-4" />
              Copiar Emails
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-10"
          />
        </div>

        {/* Table */}
        {filteredParticipants && filteredParticipants.length > 0 ? (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscrito em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/profile/${participant.player_id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.player?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {participant.player?.nickname?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {participant.player?.nickname || "Jogador"}
                          </span>
                          {participant.player?.is_highlighted && (
                            <Star className="h-3 w-3 text-accent fill-accent" />
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {participant.participant_email ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {participant.participant_email}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyEmail(participant.participant_email!)}
                          >
                            {copiedEmail === participant.participant_email ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Não informado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(participant.registered_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/profile/${participant.player_id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Perfil
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {searchTerm ? "Nenhum participante encontrado" : "Nenhum participante inscrito ainda"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
