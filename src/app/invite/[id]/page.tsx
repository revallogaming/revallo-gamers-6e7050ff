"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Zap } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const handleAccept = () => {
    router.push(`/communities/${id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 revallo-glow">
      <Card className="w-full max-w-sm glass-card border-primary/30 overflow-hidden rounded-[32px]">
        <div className="h-3 bg-primary" />
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/20 mx-auto flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">
              VOCÊ FOI CONVIDADO!
            </h1>
            <p className="text-muted-foreground text-sm">
              Um jogador te convidou para fazer parte da comunidade{" "}
              <span className="text-white font-bold">#{id}</span> na Revallo.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center gap-4 border border-white/5">
            <div className="text-center">
              <p className="text-xl font-bold">1.2k</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Membros
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">Hub</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Status
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleAccept}
              className="w-full h-14 bg-primary hover:opacity-90 font-bold rounded-2xl text-lg shadow-xl shadow-primary/20"
            >
              ACEITAR CONVITE
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full text-muted-foreground text-xs uppercase font-bold tracking-widest"
            >
              Talvez mais tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
