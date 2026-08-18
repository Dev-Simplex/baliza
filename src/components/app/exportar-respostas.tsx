"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { valor: "30", rotulo: "Últimos 30 dias" },
  { valor: "90", rotulo: "Últimos 90 dias" },
  { valor: "365", rotulo: "Último ano" },
  { valor: "tudo", rotulo: "Tudo" },
] as const;

/**
 * Baixa as respostas concluídas em CSV.
 *
 * ─── Por que o período fica AQUI, e não filtrando a tela inteira ──────────
 * "Últimos 30 dias" é uma pergunta que faz sentido sobre uma LISTA de
 * respostas, cada uma com a sua data. Boa parte dos indicadores desta página
 * não é desse tipo: "vagas abertas" e "usuários ativos" são estados de agora,
 * não quantidades acumuladas num intervalo. Um seletor no topo aplicaria o
 * recorte a alguns cartões e silenciosamente não a outros — e uma tela em que
 * cada número responde a um período diferente é pior do que uma tela sem
 * período nenhum, porque parece consistente.
 *
 * Então o recorte mora onde ele é inequívoco: no arquivo que sai daqui.
 *
 * ─── Âncora crua, e não `BotaoLink` ───────────────────────────────────────
 * `BotaoLink` navega com `next/link`, que faz navegação do CLIENTE — e o
 * destino aqui não é uma página, é um arquivo. É o mesmo motivo pelo qual o
 * botão de salvar PDF também é uma âncora com `buttonVariants`: deixar o
 * navegador cuidar do download inteiro (nome pelo cabeçalho, progresso,
 * retomada) em vez de reimplementar pior o que ele já faz.
 */
/**
 * `podeExportar` chega decidido do servidor, e a rota decide de novo.
 *
 * Esconder o botão não é a trava — a trava é o 403 em `relatorios/csv`. Isto
 * existe para que quem não pode não descubra pelo erro: um botão que sempre
 * falha é pior que um botão que não está lá.
 */
export function ExportarRespostas({ podeExportar }: { podeExportar: boolean }) {
  const [periodo, setPeriodo] = useState<string>("tudo");

  if (!podeExportar) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="periodo-da-exportacao" className="sr-only">
        Período da exportação
      </label>
      <select
        id="periodo-da-exportacao"
        value={periodo}
        onChange={(e) => setPeriodo(e.target.value)}
        className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
      >
        {PERIODOS.map((p) => (
          <option key={p.valor} value={p.valor}>
            {p.rotulo}
          </option>
        ))}
      </select>

      <a
        href={`/relatorios/csv?periodo=${periodo}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1.5",
        )}
      >
        <Download className="size-3.5" />
        Exportar CSV
      </a>
    </div>
  );
}
