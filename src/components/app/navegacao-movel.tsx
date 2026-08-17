"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

import { AlternarTema } from "@/components/alternar-tema";
import { BarraLateral } from "@/components/app/barra-lateral";
import { Marca } from "@/components/marca";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * A navegação no celular.
 *
 * Duas coisas que a versão anterior não fazia e que separam "gaveta" de
 * "navegação que funciona":
 *
 * 1. A gaveta FECHA ao navegar. Sem isso, tocar em "Vagas" trocava a página
 *    atrás de um painel que continuava tampando a tela — e a pessoa tinha que
 *    fechar à mão para ver o que pediu.
 * 2. O gatilho tem 44px. Um ícone de 16px dentro de uma caixa de 36px é um
 *    alvo que o polegar erra, e ele é o ÚNICO caminho para o resto do produto
 *    na tela pequena.
 */
export function NavegacaoMovel({
  ehAdminDaPlataforma,
}: {
  ehAdminDaPlataforma: boolean;
}) {
  const [aberta, setAberta] = useState(false);

  return (
    <Sheet open={aberta} onOpenChange={setAberta}>
      <SheetTrigger
        aria-label="Abrir navegação"
        className="grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[min(19rem,85vw)] gap-0 bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Navegação</SheetTitle>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <BarraLateral
            ehAdminDaPlataforma={ehAdminDaPlataforma}
            aoNavegar={() => setAberta(false)}
          />
        </div>

        {/* O tema mora AQUI no celular, e não no cabeçalho. Em 320px o
            cabeçalho já carrega gaveta, marca e conta; um quarto controle
            espremeria os três. Na gaveta há espaço para os 44px de alvo. */}
        <div className="flex items-center justify-between gap-3 border-t border-sidebar-border px-5 py-4">
          <span className="etiqueta">Tema</span>
          <AlternarTema tamanho="confortavel" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Onde a pessoa está, dito no cabeçalho.
 *
 * No desktop isso é redundante com a barra lateral, e por isso o texto é
 * discreto. No celular a barra lateral não existe: sem esta linha, todas as
 * telas começam iguais e a pessoa perde a referência de onde entrou. É a mesma
 * razão de a marca aparecer aqui só abaixo de `lg` — ela vive na barra lateral
 * quando a barra lateral existe.
 */
const SECOES: { prefixo: string; rotulo: string }[] = [
  { prefixo: "/dashboard", rotulo: "Visão geral" },
  { prefixo: "/vagas", rotulo: "Vagas" },
  { prefixo: "/candidatos", rotulo: "Candidatos" },
  { prefixo: "/relatorios", rotulo: "Relatórios" },
  { prefixo: "/como-funciona", rotulo: "Como funciona" },
  { prefixo: "/configuracoes", rotulo: "Configurações" },
  { prefixo: "/admin", rotulo: "Administração" },
];

export function SecaoAtual() {
  const caminho = usePathname();
  const secao = SECOES.find(
    ({ prefixo }) => caminho === prefixo || caminho.startsWith(`${prefixo}/`),
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Marca href="/dashboard" tamanho="sm" className="lg:hidden" />
      {secao && (
        <span className="hidden truncate t-corpo-sm font-medium text-muted-foreground lg:inline">
          {secao.rotulo}
        </span>
      )}
    </div>
  );
}
