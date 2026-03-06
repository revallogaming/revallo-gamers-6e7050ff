"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

export function InviteDialog({
  isOpen,
  onClose,
  communityId,
  communityName,
}: InviteDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // In a real app, this would be a specific invite token or a slug
  const inviteLink = `${window.location.origin}/communities?join=${communityId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteLink)}&bgcolor=130B1A&color=ffffff`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${communityName}`,
          text: `Entre no meu hub no Revallo: ${communityName}`,
          url: inviteLink,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D0B1A] border-white/10 text-white max-w-sm rounded-[32px] p-8 outline-none">
        <DialogHeader className="items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <Share2 className="text-primary h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter mb-2">
            Convidar <span className="text-primary">Players</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-bold text-xs">
            Compartilhe o link ou o QR Code abaixo para convidar amigos para o <strong>{communityName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {!showQR ? (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  readOnly
                  value={inviteLink}
                  className="bg-white/5 border-white/10 h-14 pr-14 rounded-2xl text-[10px] font-bold text-gray-400 focus-visible:ring-0"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 rounded-2xl font-black uppercase italic tracking-widest text-[10px] gap-2"
                >
                  <Share2 size={16} />
                  Compartilhar
                </Button>
                <Button
                  onClick={() => setShowQR(true)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-black uppercase italic tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20"
                >
                  <QrCode size={16} />
                  QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-3xl mb-6 shadow-2xl">
                <img src={qrCodeUrl} alt="QR Code Convite" className="w-[180px] h-[180px]" />
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowQR(false)}
                className="text-gray-500 hover:text-white font-black uppercase italic tracking-widest text-[10px]"
              >
                Voltar para o Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
