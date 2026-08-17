import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TemaProvider } from "@/components/tema-provider";
import "./globals.css";

/**
 * Duas fontes, e só.
 *
 * Inter Tight carrega interface, títulos e corpo. Não há um segundo tipo de
 * display: a Baliza tira autoridade de hierarquia e espaço, não de uma grotesca
 * larga no topo da página — e uma fonte a menos é um arquivo a menos no caminho
 * crítico de quem abre o questionário pelo celular no meio da rua.
 *
 * JetBrains Mono carrega o que é dado: escore, faixa, código de acesso, contagem,
 * etiqueta. Ela existe aqui por uma razão só, que é `tabular-nums` — número que
 * não muda de largura quando muda de valor. Coluna que dança tira a legibilidade
 * de um ranking inteiro.
 */
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
    default: "Baliza — Veja além do currículo. Decida com referência.",
    template: "%s · Baliza",
  },
  description:
    "Compare o perfil comportamental de cada candidato com o que a vaga realmente pede. Receba a aderência explicada, o nível de confiança da resposta e as perguntas certas para a entrevista.",
  applicationName: "Baliza",
  openGraph: {
    title: "Baliza — Veja além do currículo",
    description:
      "Pessoa + vaga. Aderência explicada, com faixa-alvo, confiança e roteiro de entrevista pronto.",
    siteName: "Baliza",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#101010" },
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
      className={`${ui.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col antialiased">
        <TemaProvider>{children}</TemaProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
