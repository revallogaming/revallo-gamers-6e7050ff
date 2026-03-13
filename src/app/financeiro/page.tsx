"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, CREDIT_PACKAGES } from "@/hooks/useCredits";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";
import { WithdrawFundsDialog } from "@/components/WithdrawFundsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserPixKey } from "@/hooks/useUserPixKey";
import {
  Wallet,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  History,
  CheckCircle,
  CreditCard as PixIcon,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SEO } from "@/components/SEO";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { OrganizerPaymentInfo } from "@/types";

export default function FinanceiroPage() {
  const { user, profile, loading } = useAuth();
  const { transactions } = useCredits();
  const { pixKey, isLoading: loadingPix, savePixKey } = useUserPixKey();
  const router = useRouter();

  const [pixKeyInput, setPixKeyInput] = useState("");
  const [isSavingPix, setIsSavingPix] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (pixKey) {
      setPixKeyInput(pixKey.pix_key || "");
    }
  }, [pixKey]);

  const handleSavePixKey = async () => {
    if (!user?.uid) return;
    setIsSavingPix(true);
    try {
      await savePixKey.mutateAsync({
        pixKeyType: 'random', // Default or allow selection
        pixKey: pixKeyInput,
      });
    } catch (error) {
      console.error("Error saving PIX key:", error);
    } finally {
      setIsSavingPix(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] bg-nebula text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      <SEO title="Financeiro - Revallo" />
      <Header />

      <main className="container py-12 mx-auto px-4 relative z-10 max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao Perfil
            </Link>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Financeiro
            </h1>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic mb-1">Saldo de Créditos</p>
             <div className="text-3xl font-black italic tracking-tighter text-white bg-purple-500/10 px-6 py-2 border border-purple-500/20">
               {profile?.credits || 0} <span className="text-lg text-primary">REV</span>
             </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Actions / Recharge */}
            <Card className="bg-[#050505] border-white/5 rounded-none p-8">
              <div className="flex gap-4">
                <BuyCreditsDialog />
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="bg-[#050505] border-white/5 rounded-none p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-black italic uppercase tracking-widest text-white">Histórico de Atividade</h3>
                </div>
              </div>

              <div className="space-y-2">
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white/2 border border-white/5 hover:bg-white/3 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                           {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black italic uppercase text-white">{tx.description || tx.type}</p>
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">
                            {format(new Date(tx.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-lg font-black italic tracking-tighter ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}R$ {(Math.abs(tx.amount) / 10).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-none">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Nenhuma transação encontrada</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Area: PIX Key & Info */}
          <div className="lg:col-span-4 space-y-8">
             <Card className="bg-[#050505] border-white/5 rounded-none p-8 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-3 mb-6">
                  <PixIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Chave PIX para Recebimento</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic ml-1">Chave Registrada</Label>
                    <Input
                      value={pixKeyInput}
                      onChange={(e) => setPixKeyInput(e.target.value)}
                      placeholder="CPF, Email, Telefone..."
                      className="bg-white/5 border-white/10 rounded-none h-12 text-sm font-bold placeholder:text-gray-800"
                    />
                  </div>

                  <Button
                    onClick={handleSavePixKey}
                    disabled={isSavingPix || loadingPix}
                    className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-none border border-white/10 text-[10px] font-black uppercase italic tracking-widest transition-all"
                  >
                    {isSavingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Chave PIX"}
                  </Button>

                  {pixKey?.pix_key && (
                    <div className="p-4 bg-green-500/5 border border-green-500/10 flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] font-black italic text-green-700 uppercase leading-relaxed">Sua conta está configurada para receber repasses automáticos de torneios.</p>
                    </div>
                  )}
                </div>
             </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
