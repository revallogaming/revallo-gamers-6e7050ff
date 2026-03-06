"use client";

import { useMutation } from "@tanstack/react-query";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export type ReportType = "community" | "tournament" | "user";

interface SubmitReportParams {
  type: ReportType;
  targetId: string;
  reporterId: string;
  reason: string;
  details?: string;
}

export function useReports() {
  const submitReport = useMutation({
    mutationFn: async (params: SubmitReportParams) => {
      await addDoc(collection(db, "reports"), {
        ...params,
        status: "pending",
        created_at: serverTimestamp(),
      });
    },
    onSuccess: () => {
      toast.success("Denúncia enviada com sucesso. Nossa equipe irá analisar.");
    },
    onError: (error) => {
      console.error("Error submitting report:", error);
      toast.error("Erro ao enviar denúncia. Tente novamente mais tarde.");
    },
  });

  return {
    submitReport,
  };
}
