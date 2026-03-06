"use client";

import { useState } from "react";
import { useLFGActions } from "@/hooks/useLFG";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Users,
  Gamepad2,
  Trophy,
  MapPin,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export function CreateLFGDialog({ children }: { children: React.ReactNode }) {
  const { createLFG } = useLFGActions();
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      toast.error("Acesse sua conta para criar um recrutamento");
      router.push("/auth");
      return;
    }
    setOpen(newOpen);
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    game: "",
    rank: "",
    region: "Brasil",
    style: "Competitive",
    slots: [{ role: "Qualquer Role", filled: false }],
  });

  const handleAddSlot = () => {
    setForm((prev) => ({
      ...prev,
      slots: [...prev.slots, { role: "Qualquer Role", filled: false }],
    }));
  };

  const handleRemoveSlot = (index: number) => {
    if (form.slots.length > 1) {
      setForm((prev) => ({
        ...prev,
        slots: prev.slots.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSlotChange = (index: number, role: string) => {
    setForm((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) => (i === index ? { ...s, role } : s)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.game || !form.title || !form.rank) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      await createLFG.mutateAsync(form);
      toast.success("Recrutamento publicado!");
      setOpen(false);
      setForm({
        title: "",
        description: "",
        game: "",
        rank: "",
        region: "Brasil",
        style: "Competitive",
        slots: [{ role: "Qualquer Role", filled: false }],
      });
    } catch (error: any) {
      toast.error("Erro ao publicar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#0D0D0F] border-white/5 text-white max-w-2xl rounded-[40px] p-10 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
            Recrutar <span className="text-primary">Squad</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">
            Encontre os melhores jogadores para o seu time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
                Título do Anúncio
              </Label>
              <Input
                placeholder="Ex: Duo para subir Imortal"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold"
                required
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
                Jogo
              </Label>
              <Select
                onValueChange={(v) => setForm({ ...form, game: v })}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold italic uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="Selecione o jogo" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D0D0F] border-white/10 text-white">
                  <SelectItem value="Free Fire">FREE FIRE</SelectItem>
                  <SelectItem value="Valorant">VALORANT</SelectItem>
                  <SelectItem value="Blood Strike">BLOOD STRIKE</SelectItem>
                  <SelectItem value="COD Warzone">COD WARZONE</SelectItem>
                  <SelectItem value="Outros">OUTROS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
                Rank Mínimo
              </Label>
              <Input
                placeholder="Ex: Diamante"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold"
                required
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
                Região
              </Label>
              <Input
                placeholder="Ex: Brasil"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
                Estilo de Jogo
              </Label>
              <Select
                defaultValue="Competitive"
                onValueChange={(v) => setForm({ ...form, style: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold italic uppercase text-[10px] tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D0D0F] border-white/10 text-white">
                  <SelectItem value="Competitive">COMPETITIVO</SelectItem>
                  <SelectItem value="Casual">CASUAL</SelectItem>
                  <SelectItem value="Scrims">SCRIMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-gray-600 px-2 italic">
              Descrição
            </Label>
            <Textarea
              placeholder="Fale um pouco sobre o que você busca no squad..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-white/5 border-white/5 rounded-xl text-white font-medium resize-none min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <Label className="text-[10px] font-black uppercase text-gray-600 italic">
                Vagas no Squad
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddSlot}
                className="text-primary hover:bg-primary/10 h-8 font-black uppercase text-[9px] italic"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Vaga
              </Button>
            </div>
            <div className="space-y-3">
              {form.slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  <Input
                    placeholder="Função (Ex: Duelista, IGL...)"
                    value={slot.role}
                    onChange={(e) => handleSlotChange(index, e.target.value)}
                    className="flex-1 bg-white/5 border-white/5 h-12 rounded-xl text-white font-bold italic uppercase text-[10px]"
                  />
                  {form.slots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlot(index)}
                      className="h-12 w-12 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:opacity-90 text-white h-16 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Zap className="mr-2 h-5 w-5 animate-pulse" /> Publicando...
                </>
              ) : (
                "Publicar Recrutamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
