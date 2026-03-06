"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, Upload, Loader2, Coins, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const GALLERY_AVATARS = [
  "/avatars/avatar_hacker.png",
  "/avatars/avatar_mage.png",
  "/avatars/avatar_ninja.png",
  "/avatars/avatar_sniper.png",
  "/avatars/avatar_warrior.png",
];

const CUSTOM_AVATAR_COST = 50;

interface AvatarEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: string | null;
  onSuccess: (newUrl: string) => void;
}

export function AvatarEditDialog({ isOpen, onOpenChange, currentAvatar, onSuccess }: AvatarEditDialogProps) {
  const { user, profile } = useAuth();
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Crop state
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Canvas is empty');
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleApplyGallery = async () => {
    if (!selectedGallery || !user?.uid) return;
    setIsUploading(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        avatar_url: selectedGallery,
        updated_at: new Date().toISOString()
      });
      toast.success("Avatar atualizado!");
      onSuccess(selectedGallery);
      onOpenChange(false);
    } catch {
      toast.error("Erro ao atualizar avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadCustom = async () => {
    if (!src || !completedCrop || !imgRef.current || !user?.uid) return;
    
    const userCredits = profile?.credits || 0;
    if (userCredits < CUSTOM_AVATAR_COST) {
      toast.error(`Créditos insuficientes. Custo: ${CUSTOM_AVATAR_COST} créditos.`);
      return;
    }

    if (!confirm(`O upload de foto personalizada custa ${CUSTOM_AVATAR_COST} créditos. Continuar?`)) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      
      const url = await uploadToCloudinary(file);
      
      // Update profile and deduct credits
      await updateDoc(doc(db, "profiles", user.uid), {
        avatar_url: url,
        credits: increment(-CUSTOM_AVATAR_COST),
        updated_at: new Date().toISOString()
      });

      toast.success("Avatar personalizado atualizado!");
      onSuccess(url);
      onOpenChange(false);
      setSrc(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro no upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0B1A] border-white/10 text-white rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white">
            Editar Avatar
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
            Escolha um avatar da galeria ou faça upload de sua própria foto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Gallery Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Galeria Gratuita</h4>
            <div className="flex flex-wrap gap-4">
              {GALLERY_AVATARS.map((url) => (
                <button
                  key={url}
                  onClick={() => {
                    setSelectedGallery(url);
                    setSrc(null);
                  }}
                  className={`relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedGallery === url ? "border-primary scale-105 shadow-lg shadow-primary/20" : "border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  {selectedGallery === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest italic text-gray-600">
              <span className="bg-[#0D0B1A] px-2">OU</span>
            </div>
          </div>

          {/* Custom Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Foto Personalizada</h4>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black italic uppercase tracking-widest text-primary">Custo: {CUSTOM_AVATAR_COST} Créditos</span>
              </div>
            </div>

            {!src ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/5 hover:border-primary/50 cursor-pointer transition-colors bg-white/2">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-gray-400">Clique para selecionar imagem</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center bg-black/50 p-4 border border-white/10">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={src}
                      onLoad={onImageLoad}
                      className="max-h-[400px] object-contain"
                    />
                  </ReactCrop>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSrc(null)}
                    className="text-[10px] font-black uppercase italic tracking-widest hover:bg-white/5"
                  >
                    Voltar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUploadCustom}
                    disabled={isUploading || !completedCrop}
                    className="bg-primary text-white hover:bg-primary/90 text-[10px] font-black uppercase italic tracking-widest px-6"
                  >
                    {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Cortar e Usar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!src && (
          <div className="pt-6 border-t border-white/5">
            <Button
              className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-black uppercase italic tracking-widest text-xs"
              onClick={handleApplyGallery}
              disabled={isUploading || !selectedGallery}
            >
              {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {selectedGallery ? "Usar Avatar da Galeria" : "Selecione um Avatar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
