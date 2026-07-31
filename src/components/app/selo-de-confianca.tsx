import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Confianca = {
  selo: "alta" | "media" | "baixa";
  rotulo: string;
  emoji: string;
  sinais: string[];
  texto: string;
};

const ESTILO = {
  alta: "border-dentro/40 bg-dentro/10 text-dentro",
  media: "border-marca/45 bg-marca-forte/10 text-marca",
  baixa: "border-fora/45 bg-fora/10 text-fora",
} as const;

const NOME_DO_SINAL: Record<string, string> = {
  desejabilidade: "respostas socialmente desejáveis",
  inconsistencia: "respostas inconsistentes entre itens equivalentes",
  linha_reta: "sequência longa de respostas idênticas",
  velocidade: "tempo por item abaixo do necessário para ler",
  convergencia: "cenários e afirmações contam histórias diferentes",
};

/**
 * Selo de confiança.
 *
 * Regra do §4.4: o fit score NUNCA aparece sozinho — sempre com o selo ao lado.
 * O texto calibra a confiança do recrutador; ele não acusa o candidato.
 */
export function SeloDeConfianca({
  confianca,
  tamanho = "md",
}: {
  confianca: Confianca;
  tamanho?: "sm" | "md";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1.5 rounded-full border font-medium",
              ESTILO[confianca.selo],
              tamanho === "sm"
                ? "px-2 py-0.5 t-legenda"
                : "px-2.5 py-1 text-xs",
            )}
          />
        }
      >
        <span
          className={cn(
            "rounded-full bg-current",
            tamanho === "sm" ? "size-1.5" : "size-2",
          )}
        />
        Confiança {confianca.rotulo.toLowerCase()}
      </TooltipTrigger>

      <TooltipContent className="max-w-xs" side="top">
        <p className="t-corpo-sm leading-relaxed">{confianca.texto}</p>
        {confianca.sinais.length > 0 && (
          <ul className="mt-2 space-y-0.5 border-t border-current/15 pt-2 t-legenda opacity-90">
            {confianca.sinais.map((s) => (
              <li key={s}>· {NOME_DO_SINAL[s] ?? s}</li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
