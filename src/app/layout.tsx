import "@/styles/globals.css";
import { Inter, Rajdhani, Orbitron } from "next/font/google";
import ClientLayout from "./client-layout";
import { Metadata } from "next";
import { JSONLD } from "@/components/SEO";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Revallo - Campeonatos • Apostados • Comunidades",
  description:
    "A plataforma competitiva do Brasil: campeonatos com premiação real, apostados com Pix instantâneo e comunidades de nível pro para Free Fire, Warzone, Valorant, Fortnite, CoD Mobile e Lumershift.",
  keywords: ["Free Fire", "Warzone", "Valorant", "Fortnite", "CoD Mobile", "Campeonatos", "Apostados", "Esports Brasil", "Revallo"],
  authors: [{ name: "Revallo Team" }],
  metadataBase: new URL("https://revallo.com.br"), // Substitua pela URL real de produção
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Revallo - A Arena do Esports Brasileiro",
    description: "Campeonatos com premiação real, apostados com Pix e comunidades pro. Free Fire, Warzone, Valorant e mais.",
    url: "https://revallo.com.br",
    siteName: "Revallo",
    images: [
      {
        url: "/og-image.png", // Certifique-se de que esta imagem existe ou crie uma depois
        width: 1200,
        height: 630,
        alt: "Revallo Platform Preview",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revallo - Compete. Ganhe. Saca.",
    description: "Campeonatos reais + apostados 4v4 com Pix na hora. Free Fire, Warzone, Valorant, Fortnite e mais.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <JSONLD />
      </head>
      <body
        className={`${inter.variable} ${rajdhani.variable} ${orbitron.variable} ${inter.className} min-h-screen text-white selection:bg-primary/30 font-sans`}
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
