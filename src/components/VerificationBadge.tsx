"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  type: "none" | "admin" | "influencer" | "verified" | undefined;
  size?: "sm" | "md" | "lg" | "xs" | "xl";
  className?: string;
  showText?: boolean;
}

export function VerificationBadge({ 
  type, 
  size = "md", 
  className,
  showText = false
}: VerificationBadgeProps) {
  if (!type || type === "none" || type === "verified") return null;

  const config = {
    admin: {
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: ShieldCheck,
      label: "Staff",
    },
    influencer: {
      color: "text-[#FFD700]", // Gold
      bg: "bg-[#FFD700]/10",
      border: "border-[#FFD700]/20",
      icon: CheckCircle2,
      label: "Influenciador",
    },
  }[type as "admin" | "influencer"];

  const Icon = config.icon;
  
  const sizeClasses = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-7 w-7",
  }[size];

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border",
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn(sizeClasses, config.color)} />
      {showText && (
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest italic",
          config.color
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}
