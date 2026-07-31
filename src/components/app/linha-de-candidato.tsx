import Link from "next/link";

import { FaixaMinima } from "@/components/faixa";
import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { iniciais as calcularIniciais, numero } from "@/lib/formato";
import { cn } from "@/lib/utils";

export type MedidorMinimo = {
  fator: string;
  escore: number;
  faixa: [number, number];
  dentro: boolean;
  irrelevante?: boolean;
};

/**
 * Linha de candidato.
 *
 * Estava reimplementada em quatro telas — visão geral, ranking da vaga, lista
 * de candidatos e histórico. Cada cópia tinha uma largura de coluna diferente
 * para o escore, então o mesmo número aparecia alinhado de três jeitos.
 *
 * Uma implementação, três modos de identificação (posição no ranking, iniciais
 * ou nada), e os medidores como opção — porque só o ranking da vaga tem uma
 * faixa alvo contra a qual comparar.
 */
export function LinhaDeCandidato({
  href,
  nome,
  detalhe,
  meta,
  escore,
  confianca,
  posicao,
  comIniciais = false,
  medidores,
  alerta,
}: {
  href: string;
  nome: string;
  detalhe?: React.ReactNode;
  meta?: React.ReactNode;
  escore: number | null;
  confianca?: Confianca;
  posicao?: number;
  comIniciais?: boolean;
  medidores?: MedidorMinimo[];
  alerta?: string;
}) {
  return (
    <li>
      <Link href={href} className="linha-clicavel block px-5 py-3.5">
        <div className="flex items-center gap-3 sm:gap-4">
          {posicao !== undefined && (
            <span
              className="leitura w-5 shrink-0 text-sm text-muted-foreground"
              aria-label={`Posição ${posicao}`}
            >
              {posicao}
            </span>
          )}

          {comIniciais && (
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary t-legenda font-semibold text-muted-foreground"
            >
              {calcularIniciais(nome)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{nome}</p>
            {detalhe && (
              <p className="t-legenda truncate text-muted-foreground">{detalhe}</p>
            )}
          </div>

          {meta && (
            <span className="etiqueta hidden shrink-0 md:block">{meta}</span>
          )}

          {confianca && (
            <div className="hidden shrink-0 sm:block">
              <SeloDeConfianca tamanho="sm" confianca={confianca} />
            </div>
          )}

          <span className="leitura w-12 shrink-0 text-right t-corpo font-semibold sm:w-14">
            {escore === null ? "—" : numero(escore, 1)}
          </span>
        </div>

        {medidores && medidores.length > 0 && (
          <div
            className={cn(
              "mt-3 grid gap-2",
              posicao !== undefined || comIniciais ? "pl-8 sm:pl-9" : "",
            )}
            style={{
              gridTemplateColumns: `repeat(${medidores.length}, minmax(0, 1fr))`,
            }}
          >
            {medidores.map((m) => (
              <div key={m.fator} className={cn(m.irrelevante && "opacity-25")}>
                <p className="etiqueta mb-1">{m.fator}</p>
                {m.irrelevante ? (
                  <div className="h-1.5 rounded-full bg-muted" />
                ) : (
                  <FaixaMinima
                    escore={m.escore}
                    faixa={m.faixa}
                    dentro={m.dentro}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {alerta && (
          <p
            className={cn(
              "t-legenda mt-2.5 text-fora",
              posicao !== undefined || comIniciais ? "pl-8 sm:pl-9" : "",
            )}
          >
            {alerta}
          </p>
        )}
      </Link>
    </li>
  );
}
