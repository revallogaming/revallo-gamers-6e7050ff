import "@/styles/globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revallo - O Seu Mundo Gamer Começa Aqui",
  description:
    "Torneios profissionais, comunidades gamers e um ambiente criado para quem vive o jogo.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen text-white selection:bg-primary/30`}
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
