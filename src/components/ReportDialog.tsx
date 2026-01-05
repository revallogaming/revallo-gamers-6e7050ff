import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "tournament" | "mini_tournament" | "user";
  targetName: string;
}

const REPORT_REASONS = {
  tournament: [
    { value: "fraud", label: "Fraude / Golpe" },
    { value: "misleading", label: "Informações enganosas" },
    { value: "inappropriate", label: "Conteúdo inapropriado" },
    { value: "spam", label: "Spam" },
    { value: "other", label: "Outro" },
  ],
  mini_tournament: [
    { value: "fraud", label: "Fraude / Golpe" },
    { value: "misleading", label: "Informações enganosas" },
    { value: "inappropriate", label: "Conteúdo inapropriado" },
    { value: "spam", label: "Spam" },
    { value: "other", label: "Outro" },
  ],
  user: [
    { value: "harassment", label: "Assédio / Bullying" },
    { value: "fraud", label: "Fraude / Golpe" },
    { value: "impersonation", label: "Falsidade ideológica" },
    { value: "inappropriate", label: "Comportamento inapropriado" },
    { value: "cheating", label: "Trapaça em jogos" },
    { value: "other", label: "Outro" },
  ],
};

const TARGET_LABELS = {
  tournament: "torneio",
  mini_tournament: "mini torneio",
  user: "usuário",
};

export function ReportDialog({
  open,
  onOpenChange,
  targetId,
  targetType,
  targetName,
}: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Você precisa estar logado para denunciar");
      if (!reason) throw new Error("Selecione um motivo");

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        report_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia enviada com sucesso!");
      onOpenChange(false);
      setReason("");
      setDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    reportMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5" />
            Denunciar {TARGET_LABELS[targetType]}
          </DialogTitle>
          <DialogDescription>
            Você está denunciando: <strong>{targetName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo da denúncia *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS[targetType].map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição adicional (opcional)</Label>
            <Textarea
              placeholder="Descreva o problema em detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
          >
            {reportMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enviar denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
