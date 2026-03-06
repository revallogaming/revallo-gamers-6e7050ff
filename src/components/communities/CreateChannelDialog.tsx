import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCommunityActions } from "@/hooks/useCommunities";
import { toast } from "sonner";
import { MessageSquare, Megaphone, ShieldAlert } from "lucide-react";

interface CreateChannelDialogProps {
  communityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({
  communityId,
  open,
  onOpenChange,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "announcement" | "broadcast">("text");
  const { createChannel } = useCommunityActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createChannel.mutateAsync({
        communityId,
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        type: type as any,
      });
      toast.success("Canal criado com sucesso!");
      setName("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar canal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0D0F] border-white/5 text-white sm:max-w-[425px] rounded-[32px] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
            Criar Novo <span className="text-primary">Canal</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
              Nome do Canal
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: avisos-gerais"
              className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary/40 font-bold"
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
              Tipo de Canal
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  type === "text"
                    ? "bg-primary/10 border-primary/30 text-white"
                    : "bg-white/2 border-white/5 text-gray-500 hover:bg-white/5"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === "text" ? "bg-primary text-black" : "bg-white/5"}`}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="font-black italic uppercase text-xs">Canal de Texto</p>
                  <p className="text-[9px] font-bold opacity-60">Público para todos os membros</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("announcement")}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  type === "announcement"
                    ? "bg-amber-500/10 border-amber-500/30 text-white"
                    : "bg-white/2 border-white/5 text-gray-500 hover:bg-white/5"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === "announcement" ? "bg-amber-500 text-black" : "bg-white/5"}`}>
                  <Megaphone size={18} />
                </div>
                <div>
                  <p className="font-black italic uppercase text-xs">Canal de Avisos</p>
                  <p className="text-[9px] font-bold opacity-60">Apenas organizadores publicam</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("broadcast" as any)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  type === "broadcast"
                    ? "bg-red-500/10 border-red-500/30 text-white"
                    : "bg-white/2 border-white/5 text-gray-500 hover:bg-white/5"
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === "broadcast" ? "bg-red-500 text-black" : "bg-white/5"}`}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="font-black italic uppercase text-xs">Staff Only</p>
                  <p className="text-[9px] font-bold opacity-60">Visível apenas para organização</p>
                </div>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={createChannel.isPending || !name.trim()}
              className="w-full bg-primary hover:opacity-90 h-14 rounded-2xl font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 text-xs"
            >
              {createChannel.isPending ? "Criando..." : "Finalizar Criação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
