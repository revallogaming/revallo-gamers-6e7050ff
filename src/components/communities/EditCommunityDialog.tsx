import { useState } from "react";
import { useCommunityActions } from "@/hooks/useCommunities";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Community } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditCommunityDialogProps {
  community: Community;
  children?: React.ReactNode;
}

export function EditCommunityDialog({
  community,
  children,
}: EditCommunityDialogProps) {
  const { updateCommunity } = useCommunityActions();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    community.banner_url,
  );
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || "",
  });

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bannerUrl = community.banner_url;
      if (bannerFile) {
        bannerUrl = await uploadToCloudinary(bannerFile, "community-banners");
      }

      await updateCommunity.mutateAsync({
        id: community.id,
        name: formData.name,
        description: formData.description,
        banner_url: bannerUrl,
      });

      toast.success("Comunidade atualizada com sucesso!");
      setOpen(false);
    } catch (error) {
      console.error("Error updating community:", error);
      toast.error("Erro ao atualizar comunidade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#0D0D0F] border-white/5 rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Editar Comunidade
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Banner da Comunidade
            </Label>
            <div
              className={cn(
                "relative h-40 border-2 border-dashed rounded-2xl overflow-hidden transition-all group",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-white/10 hover:border-primary/50",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              onClick={() =>
                document.getElementById("edit-banner-upload")?.click()
              }
            >
              {bannerPreview ? (
                <>
                  <img
                    src={bannerPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">
                      Alterar Banner
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-xs font-medium">
                    Clique ou arraste um banner
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1"
              >
                Nome da Comunidade
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1"
              >
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px] bg-white/5 border-white/10 rounded-xl focus:border-primary/50 text-white"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl h-12 border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px]"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-black italic uppercase rounded-xl h-12 tracking-widest shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "SALVAR ALTERAÇÕES"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
