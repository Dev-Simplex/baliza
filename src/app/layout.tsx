import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TemaProvider } from "@/components/tema-provider";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--fonte-display",
  subsets: ["latin"],
  display: "swap",
});

const ui = Inter_Tight({
  variable: "--fonte-ui",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--fonte-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prumo — não contrate nunca mais com vendas nos olhos",
    template: "%s · Prumo",
  },
  description:
    "Currículo mostra o que a pessoa fez. Entrevista mostra quem se apresenta bem. O Prumo mostra o que decide a contratação — com a conta aberta do lado.",
  applicationName: "Prumo",
  openGraph: {
    title: "Prumo — não contrate nunca mais com vendas nos olhos",
    description:
      "Ranking com aderência explicada e roteiro de entrevista pronto. Seis minutos por candidato.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // As variáveis de fonte precisam ficar no <html>: `font-sans` é aplicado
    // nele, e uma var declarada só no <body> não resolve acima — o texto cai
    // silenciosamente no serifado padrão do navegador.
    <html
      lang="pt-BR"
      className={`${display.variable} ${ui.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <TemaProvider>{children}</TemaProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
