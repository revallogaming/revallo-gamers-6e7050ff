"use client";

import { 
  Hero, 
  ActivityPreview, 
  PlatformPreview, 
  Features
} from "./index";

import dynamic from "next/dynamic";

const Showcase = dynamic(() => import("./Showcase").then(mod => mod.Showcase), {
  loading: () => <div className="h-[400px] bg-black/20 animate-pulse rounded-[40px] m-6" />
});

const FAQ = dynamic(() => import("./FAQ").then(mod => mod.FAQ));
const CTA = dynamic(() => import("./CTA").then(mod => mod.CTA));
const RecentActivityToasts = dynamic(() => import("./RecentActivityToasts").then(mod => mod.RecentActivityToasts), {
  ssr: false
});
import { Header } from "@/components/Header";
export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020106] selection:bg-primary/30 scroll-smooth">
      <Header />
      <main className="flex-1">
        <Hero />
        <ActivityPreview />
        <PlatformPreview />
        <Showcase />
        <Features />
        <FAQ />
        <CTA />
        <RecentActivityToasts />
      </main>
      
      {/* Footer can be added here or in a separate file */}
      <footer className="py-12 border-t border-white/5 bg-[#0F0F18]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">
            © 2026 REVALLO • ELEVANDO O NÍVEL DO ESPORTS BRASILEIRO
          </p>
        </div>
      </footer>
    </div>
  );
}
