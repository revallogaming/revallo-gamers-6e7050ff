"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

interface LoginWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function LoginWallModal({
  isOpen,
  onClose,
  title = "Ação Restrita",
  description = "Você precisa estar logado para realizar esta ação. Crie sua conta em segundos e participe da comunidade!",
}: LoginWallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link href="/auth" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5"
            >
              Fazer Login
            </Button>
          </Link>
          <Link href="/auth?mode=signup" className="flex-1">
            <Button className="w-full bg-primary hover:opacity-90 shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Conta Grátis
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
