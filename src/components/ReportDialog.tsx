"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType: "tournament" | "mini_tournament" | "user" | "community";
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
  community: [
    { value: "inappropriate", label: "Conteúdo inapropriado" },
    { value: "harassment", label: "Assédio no Hub" },
    { value: "spam", label: "Spam / Divulgação" },
    { value: "fraud", label: "Fraude / Atividade Ilegal" },
    { value: "other", label: "Outro" },
  ],
};

const TARGET_LABELS = {
  tournament: "torneio",
  mini_tournament: "mini torneio",
  user: "usuário",
  community: "hub",
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
      if (!description.trim()) throw new Error("A descrição é obrigatória");

      await addDoc(collection(db, "reports"), {
        reporter_id: user.uid,
        report_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim(),
        created_at: serverTimestamp(),
        status: "pending",
      });
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
                {(REPORT_REASONS[targetType] ?? REPORT_REASONS.user).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição detalhada *</Label>
            <Textarea
              placeholder="Descreva o problema em detalhes para que possamos analisar..."
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
            disabled={!reason || !description.trim() || reportMutation.isPending}
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
