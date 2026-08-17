import { FileDown } from "lucide-react";

import { Marca } from "@/components/marca";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * O relatório em PDF.
 *
 * ─── Por que isto deixou de ser `window.print()` ───────────────────────────
 * A primeira versão abria o diálogo de impressão do navegador. Economizava uma
 * dependência e mantinha uma fonte de verdade só — mas fazia a coisa errada:
 * "salvar em PDF" abria uma CAIXA DE IMPRESSÃO, e o arquivo que saía de lá
 * vinha carimbado com a data no canto, o título da aba no topo, a URL inteira
 * no rodapé e "1/3" ao lado. Nada disso se desliga por CSS — é configuração
 * do usuário, não do site. Um relatório com `192.168.x.x:3300/candidatos/cms9…`
 * impresso no pé não é documento, é captura de tela.
 *
 * Então virou um link comum para uma rota que devolve o arquivo pronto com
 * `Content-Disposition: attachment`. Link e não botão com `fetch`: o navegador
 * já sabe baixar, e assim funciona com clique do meio, "salvar link como" e
 * sem JavaScript.
 *
 * `<a>` puro e não `next/link`: o destino é um route handler que devolve um
 * arquivo, não uma página. O roteador do Next tentaria navegar para ele por
 * conta própria e o clique não faria nada visível.
 *
 * A folha de `@media print` continua em `globals.css` e continua valendo — ela
 * agora serve a quem aperta Ctrl+P na tela, que é outro caminho e legítimo.
 */
export function BotaoSalvarPdf({
  href,
  rotulo = "Salvar em PDF",
}: {
  href: string;
  rotulo?: string;
}) {
  return (
    <a
      href={href}
      // Sai da folha por conta própria: `@media print` esconde todo `button`,
      // mas o link não é botão — o atributo é o que garante.
      data-impressao="ocultar"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
    >
      <FileDown className="size-4" />
      {rotulo}
    </a>
  );
}

// Espelha `ESTILO` de `selo-de-confianca`: média é neutra porque a cor da
// marca não codifica qualidade de dado. Ver a nota lá.
const ESTILO_DO_SELO = {
  alta: "border-dentro/40 bg-dentro/10 text-dentro",
  media: "border-linha-forte bg-secondary text-foreground",
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
            <p className="t-numero text-marca">{aderencia}</p>
            {selo && (
              <span
                className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 t-legenda font-medium ${ESTILO_DO_SELO[selo.nivel]}`}
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
        Documento gerado pela Baliza. Contém dado pessoal de candidato: trate como
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
