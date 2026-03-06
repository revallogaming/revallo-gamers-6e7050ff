"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GameType, GAME_INFO } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { normalizeExternalUrl } from "@/lib/links";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  CalendarIcon,
  Save,
  Link as LinkIcon,
  Image as ImageIcon,
  Coins,
  Users,
  Medal,
  Settings,
} from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import { cn } from "@/lib/utils";

interface EditTournamentDialogProps {
  tournament: {
    id: string;
    title?: string;
    description?: string | null;
    game?: GameType;
    rules?: string | null;
    prize_description?: string | null;
    entry_fee?: number;
    max_participants?: number;
    start_date?: string;
    end_date?: string | null;
    registration_deadline?: string;

    banner_url?: string | null;
    is_team_based?: boolean;
    min_team_size?: number;
    max_team_size?: number;
    room_info_visible?: boolean;
    organizer_id?: string;
  };
  children: React.ReactNode;
}

export function EditTournamentDialog({
  tournament,
  children,
}: EditTournamentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "" as GameType | "",
    rules: "",
    prize_description: "",
    entry_fee: 0,
    max_participants: 100,
    start_date: null as Date | null,
    end_date: null as Date | null,
    registration_deadline: null as Date | null,

    banner_url: null as string | null,
    prize_amount: 0,
    organizer_pix_key: "",
    is_team_based: false,
    min_team_size: 1,
    max_team_size: 1,
    room_info_visible: true,
  });

  useEffect(() => {
    async function fetchOrganizerInfo() {
      if (tournament?.organizer_id && open) {
        try {
          const pixDoc = await getDoc(doc(db, "organizer_payment_info", tournament.organizer_id));
          if (pixDoc.exists()) {
            setFormData(prev => ({ ...prev, organizer_pix_key: pixDoc.data().pix_key || "" }));
          }
        } catch (err) {
          console.error("Error fetching PIX key:", err);
        }
      }
    }

    if (tournament && open) {
      // Try to extract numeric prize from description if possible
      let pAmount = 0;
      if (tournament.prize_description) {
        const match = tournament.prize_description.match(/R\$\s*([\d,.]+)/);
        if (match) {
          pAmount = parseFloat(match[1].replace(".", "").replace(",", ".")) || 0;
        }
      }

      setFormData({
        title: tournament.title || "",
        description: tournament.description || "",
        game: tournament.game || "",
        rules: tournament.rules || "",
        prize_description: tournament.prize_description || "",
        prize_amount: pAmount,
        organizer_pix_key: "", // Will be loaded by fetchOrganizerInfo
        entry_fee: tournament.entry_fee ? tournament.entry_fee / 100 : 0,
        max_participants: tournament.max_participants || 100,
        start_date: tournament.start_date
          ? new Date(tournament.start_date)
          : null,
        end_date: tournament.end_date ? new Date(tournament.end_date) : null,
        registration_deadline: tournament.registration_deadline
          ? new Date(tournament.registration_deadline)
          : null,
        banner_url: tournament.banner_url || null,
        is_team_based: tournament.is_team_based || false,
        min_team_size: tournament.min_team_size || (tournament.is_team_based ? 2 : 1),
        max_team_size: tournament.max_team_size || (tournament.is_team_based ? 5 : 1),
        room_info_visible: tournament.room_info_visible ?? true,
      });
      setBannerPreview(tournament.banner_url || null);
      setBannerFile(null);
      fetchOrganizerInfo();
    }
  }, [tournament, open]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione uma imagem válida");
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.game) {
      toast.error("Selecione um jogo");
      return;
    }
    if (!user) {
      toast.error("Você precisa estar autenticado");
      return;
    }

    setLoading(true);
    try {
      // Upload banner to Cloudinary if a new file was selected
      let bannerUrl = formData.banner_url;
      if (bannerFile) {
        try {
          bannerUrl = await uploadToCloudinary(
            bannerFile,
            "revallo/tournament-banners"
          );
        } catch {
          toast.error("Erro ao fazer upload do banner");
          setLoading(false);
          return;
        }
      }

      // Update PIX key info
      if (formData.organizer_pix_key) {
        await setDoc(doc(db, "organizer_payment_info", user.uid), {
          organizer_id: user.uid,
          pix_key: formData.organizer_pix_key,
          updated_at: new Date().toISOString(),
        }, { merge: true });
      }

      // Format prize description if amount was changed
      const pDesc = formData.prize_amount > 0
        ? `R$ ${formData.prize_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : formData.prize_description;

      // Update Firestore document
      await updateDoc(doc(db, "tournaments", tournament.id), {
        title: formData.title,
        description: formData.description || null,
        game: formData.game as GameType,
        rules: formData.rules || null,
        prize_description: pDesc,
        prize_pool_total: formData.prize_amount,
        entry_fee: Math.round(formData.entry_fee * 100),
        max_participants: formData.max_participants,
        start_date: formData.start_date?.toISOString() || null,
        end_date: formData.end_date?.toISOString() || null,
        registration_deadline:
          formData.registration_deadline?.toISOString() || null,
        banner_url: bannerUrl,
        is_team_based: formData.is_team_based,
        min_team_size: formData.is_team_based ? formData.min_team_size : 1,
        max_team_size: formData.is_team_based ? formData.max_team_size : 1,
        room_info_visible: formData.room_info_visible,
        updated_at: new Date().toISOString(),
      });

      toast.success("Torneio atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournament.id] });
      setOpen(false);
    } catch (err) {
      console.error("Error updating tournament:", err);
      toast.error("Erro ao atualizar torneio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0D0B1A] border-white/10 text-white rounded-none">
        <DialogHeader className="pb-6 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white">
                Configurar Torneio
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 italic">
                Ajuste os detalhes e regras da competição
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Banner Upload */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30" /> Visual & Identidade
            </h3>
            <div
              className={cn(
                "relative border-2 border-dashed p-4 transition-all cursor-pointer group rounded-2xl overflow-hidden bg-white/2",
                isDragging
                  ? "border-primary bg-primary/10 shadow-2xl shadow-primary/10"
                  : "border-white/5 hover:border-primary/40 hover:bg-primary/5"
              )}
              onClick={() =>
                document.getElementById("edit-banner-upload")?.click()
              }
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {bannerPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden max-w-full mx-auto">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-black uppercase italic bg-primary/80 px-4 py-2">
                      Alterar Banner
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                  <ImageIcon className="h-10 w-10 mb-3 text-primary/40" />
                  <span className="text-[11px] font-black uppercase italic tracking-widest">
                    Clique ou arraste para adicionar banner
                  </span>
                  <span className="text-[9px] mt-1 text-gray-700 font-bold uppercase tracking-widest">
                    JPG, PNG, WEBP até 5MB
                  </span>
                </div>
              )}
              <input
                id="edit-banner-upload"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30" /> Informações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">
                  Título do Torneio *
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Ex: Copa Revallo de Verão"
                  className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">
                  Selecione o Jogo *
                </Label>
                <Select
                  value={formData.game}
                  onValueChange={(v) =>
                    setFormData({ ...formData, game: v as GameType })
                  }
                >
                  <SelectTrigger className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 transition-all">
                    <SelectValue placeholder="Qual será o jogo?" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D0B1A] border-white/10 text-white rounded-xl">
                    {(Object.keys(GAME_INFO) as GameType[]).map((game) => (
                      <SelectItem
                        key={game}
                        value={game}
                        className="focus:bg-primary/10 focus:text-primary transition-colors py-3"
                      >
                        <div className="flex items-center gap-2">
                          <GameIcon game={game} className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-tight">{GAME_INFO[game].name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">
                Descrição da Competição
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Conte mais sobre seu torneio..."
                className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl text-sm font-bold resize-none min-h-[100px] transition-all"
              />
            </div>

          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30" /> Regras & Premiação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="space-y-4 p-5 rounded-3xl bg-white/2 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                      Formato da Competição
                    </Label>
                    <p className="text-[9px] text-gray-600 font-bold uppercase leading-tight mt-1">
                      {formData.is_team_based 
                        ? "Competição entre Equipes/Squads" 
                        : "Competição Individual (Solo)"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={formData.is_team_based ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const isTeam = !formData.is_team_based;
                      setFormData({ 
                        ...formData, 
                        is_team_based: isTeam,
                        min_team_size: isTeam ? 2 : 1,
                        max_team_size: isTeam ? 4 : 1
                      });
                    }}
                    className="h-9 px-6 text-[10px] font-black rounded-full transition-all shadow-lg active:scale-95"
                  >
                    {formData.is_team_based ? "MULTIPLAYER / EQUIPE" : "SOLO / INDIVIDUAL"}
                  </Button>
                </div>

                {formData.is_team_based && (
                  <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic px-1">
                      Configuração Rápida de Vagas
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { label: "DUO", size: 2 },
                        { label: "TRIO", size: 3 },
                        { label: "SQUAD (4)", size: 4 },
                        { label: "PRO (5v5)", size: 5 },
                      ].map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant={formData.max_team_size === preset.size ? "default" : "outline"}
                          className="h-10 text-[9px] font-black rounded-xl border-white/5 hover:bg-primary/10 transition-all"
                          onClick={() => setFormData({ 
                            ...formData, 
                            min_team_size: preset.size, 
                            max_team_size: preset.size 
                          })}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-[8px] font-black uppercase tracking-widest text-gray-700 italic px-1">
                          Min. Jogadores
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.min_team_size}
                          onChange={(e) => setFormData({ ...formData, min_team_size: parseInt(e.target.value) || 1 })}
                          className="bg-white/5 border-white/5 focus:border-primary/50 h-10 text-xs font-bold rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[8px] font-black uppercase tracking-widest text-gray-700 italic px-1">
                          Máx. Jogadores
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.max_team_size}
                          onChange={(e) => setFormData({ ...formData, max_team_size: parseInt(e.target.value) || 1 })}
                          className="bg-white/5 border-white/5 focus:border-primary/50 h-10 text-xs font-bold rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 p-5 rounded-3xl bg-white/2 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                      Coordenação de Salas
                    </Label>
                    <p className="text-[9px] text-gray-600 font-bold uppercase leading-tight mt-1">
                      {formData.room_info_visible 
                        ? "ID/Senha visíveis automaticamente" 
                        : "ID/Senha ocultos até liberação"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={formData.room_info_visible ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, room_info_visible: !formData.room_info_visible })}
                    className="h-9 px-6 text-[10px] font-black rounded-full transition-all shadow-lg active:scale-95"
                  >
                    {formData.room_info_visible ? "ENTREGA AUTOMÁTICA" : "ENTREGA MANUAL"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1 flex items-center gap-2">
                  <Coins className="h-3 w-3" /> Inscrição (R$)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.entry_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entry_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Máx. {formData.is_team_based ? "Equipes" : "Participantes"}
                </Label>
                <Input
                  type="number"
                  min={2}
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: parseInt(e.target.value) || 100,
                    })
                  }
                  className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1 flex items-center gap-2">
                  <Medal className="h-3 w-3" /> Valor da Premiação (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.prize_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prize_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ex: 500.00"
                  className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1 flex items-center gap-2">
                  <Settings className="h-3 w-3" /> Chave PIX para Recebimento
                </Label>
                <Input
                  value={formData.organizer_pix_key}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizer_pix_key: e.target.value,
                    })
                  }
                  placeholder="CPF, Email, Telefone ou Aleatória"
                  className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1 flex items-center gap-2">
                <Medal className="h-3 w-3" /> Descrição Customizada da Premiação
              </Label>
              <Input
                value={formData.prize_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prize_description: e.target.value,
                  })
                }
                placeholder="Ex: R$ 500,00 para o vencedor + Troféu"
                className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl h-12 text-sm font-bold transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">
                Regras e Regulamento
              </Label>
              <Textarea
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
                placeholder="Quais são as regras básicas do torneio?"
                className="bg-white/2 border-white/5 focus:border-primary/50 focus:bg-primary/5 rounded-xl text-sm font-bold resize-none min-h-[120px] transition-all"
              />
            </div>
          </div>

          {/* Chronology */}
          <div className="space-y-6 pb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-primary/30" /> Cronograma
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(
                [
                  {
                    key: "registration_deadline" as const,
                    label: "Fim Inscrições",
                  },
                  { key: "start_date" as const, label: "Início" },
                  { key: "end_date" as const, label: "Término" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic px-1">
                    {label}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-bold bg-white/2 border-white/5 rounded-xl h-12 text-xs transition-all hover:bg-white/5",
                          !formData[key] && "text-gray-600"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 text-primary/60" />
                        {formData[key]
                          ? format(formData[key]!, "dd MMM, yyyy", { locale: ptBR })
                          : "Definir"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0D0B1A] border-white/10 rounded-xl overflow-hidden shadow-2xl">
                      <Calendar
                        mode="single"
                        selected={formData[key] || undefined}
                        onSelect={(date) =>
                          setFormData({ ...formData, [key]: date || null })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </div>


          <div className="flex justify-between items-center gap-3 pt-6 border-t border-white/5">
            <p className="text-[9px] font-black uppercase italic tracking-widest text-gray-700">
              * Campos obrigatórios
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl hover:bg-white/5 font-black uppercase italic tracking-widest text-[10px] transition-all"
              >
                Descartar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-white text-black hover:bg-primary hover:text-white transition-all rounded-xl font-black uppercase italic tracking-widest text-[10px] h-12 px-8 shadow-xl hover:shadow-primary/30"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Finalizar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
