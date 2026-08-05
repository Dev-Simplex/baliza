"use client";

import { FileDown } from "lucide-react";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";

/**
 * O relatório em PDF.
 *
 * ─── Por que não existe geração de PDF no servidor ─────────────────────────
 * Puppeteer/Chromium num contêiner só para desenhar um documento custa RAM,
 * tempo de build e uma SEGUNDA versão do relatório para manter em sincronia —
 * e é essa segunda versão que sempre atrasa: muda o layout na tela, o PDF
 * continua com o de antes. O diálogo do navegador salva em PDF em qualquer
 * sistema operacional e em qualquer celular, e imprime exatamente o que a
 * pessoa está vendo.
 *
 * O que isso cobra em troca é caprichar na folha de impressão, e é onde a
 * versão anterior falhava: sem `@media print`, o navegador cuspia a tela do
 * painel inteira — barra lateral, botões, cartões partidos no meio da página
 * e gráfico em branco. A folha vive em `globals.css`; este arquivo é só o
 * gatilho e o que o papel ganha de diferente da tela.
 */
export function BotaoSalvarPdf({ rotulo = "Salvar em PDF" }: { rotulo?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      // Sai da folha por conta própria: `@media print` esconde todo `button`,
      // mas o atributo deixa a intenção explícita para quem ler o markup.
      data-impressao="ocultar"
      onClick={() => window.print()}
    >
      <FileDown className="size-4" />
      {rotulo}
    </Button>
  );
}

const ESTILO_DO_SELO = {
  alta: "border-dentro/40 bg-dentro/10 text-dentro",
  media: "border-marca/45 bg-marca-forte/10 text-marca",
  baixa: "border-fora/45 bg-fora/10 text-fora",
} as const;

/**
 * O cabeçalho que só existe no papel.
 *
 * Na tela ele seria repetição: quem está no painel já sabe de quem é a página
 * e como chegou nela. Impresso, é o contrário — a folha circula solta, vai
 * para um e-mail, entra numa pasta de processo, e sem isto ninguém sabe de
 * quem é o relatório nem de quando.
 *
 * ─── Por que a aderência e o selo vêm para cá ──────────────────────────────
 * O cabeçalho da tela é escondido na impressão (senão o nome sairia duas
 * vezes), e a primeira versão disto levou junto o selo de confiança — o PDF
 * saía com a aderência aparecendo só no título de uma seção, sem o selo em
 * lugar nenhum. Isso quebra a regra §4.4 do produto: o fit NUNCA aparece
 * sozinho, porque número sem calibragem vira nota de aprovação. Então os dois
 * são reconstruídos aqui, em versão que imprime — sem tooltip, que no papel
 * não existe, e com o texto do selo por extenso, que na tela é hover.
 */
export function CabecalhoDeImpressao({
  candidato,
  vaga,
  empresa,
  respondidoEm,
  aderencia,
  selo,
}: {
  candidato: string;
  vaga: string;
  empresa: string;
  respondidoEm?: string | null;
  aderencia?: string | null;
  selo?: { nivel: "alta" | "media" | "baixa"; rotulo: string; texto: string } | null;
}) {
  return (
    <header className="so-impressao mb-6 border-b pb-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Marca href={null} tamanho="md" />
          <p className="etiqueta mt-2">Mapeamento comportamental</p>
        </div>
        <p className="t-legenda text-right text-muted-foreground">
          {empresa}
          <br />
          {respondidoEm ? `Respondido em ${respondidoEm}` : "Em andamento"}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-6">
        <div>
          <p
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--fonte-display)" }}
          >
            {candidato}
          </p>
          <p className="t-legenda text-muted-foreground">{vaga}</p>
        </div>

        {aderencia && (
          <div className="shrink-0 text-right">
            <p className="etiqueta">Aderência</p>
            <p className="leitura text-2xl leading-none font-semibold text-marca">
              {aderencia}
            </p>
            {selo && (
              <span
                className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${ESTILO_DO_SELO[selo.nivel]}`}
              >
                Confiança {selo.rotulo.toLowerCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {selo && (
        <p className="t-legenda mt-3 leading-relaxed text-muted-foreground">
          {selo.texto}
        </p>
      )}
    </header>
  );
}

/** O rodapé do documento impresso. Ver acima: por que ele existe. */
export function RodapeDeImpressao() {
  return (
    <footer className="so-impressao mt-8 border-t pt-4">
      <p className="t-legenda leading-relaxed text-muted-foreground">
        Documento gerado pelo Prumo. Contém dado pessoal de candidato: trate como
        confidencial e compartilhe apenas com quem participa deste processo
        seletivo.
      </p>
      <p className="t-legenda mt-2 leading-relaxed text-muted-foreground">
        O resultado é insumo para a entrevista, não decisão. Nenhuma dimensão
        aqui elimina candidato por si só, e a leitura só se sustenta junto da
        conversa.
      </p>
    </footer>
  );
}
