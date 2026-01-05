import { cn } from "@/lib/utils";

interface RevalloLogoProps {
  className?: string;
  size?: number;
}

export const RevalloLogo = ({ className, size = 48 }: RevalloLogoProps) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      fill="none"
      width={size}
      height={size}
      className={cn("", className)}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0a0a0f", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#15151f", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="rGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#00F5FF", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#FF00E5", stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#bgGradient)"/>
      <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="url(#rGradient)" strokeWidth="1.5" opacity="0.6"/>
      <text 
        x="32" 
        y="46" 
        textAnchor="middle" 
        fontFamily="Arial Black, Arial, sans-serif" 
        fontSize="38" 
        fontWeight="900" 
        fill="url(#rGradient)" 
        filter="url(#glow)"
      >
        R
      </text>
    </svg>
  );
};

export default RevalloLogo;
