"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Faixa } from "@/components/faixa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { atualizarPerfilDaVaga } from "@/lib/actions/vaga";
import { PERFIL_NEUTRO } from "@/lib/instrument/presets";
import {
  FATORES,
  NOMES_DE_FATOR,
  type Fator,
  type PerfilAlvo,
  type TipoDeDimensao,
} from "@/lib/instrument/types";
import {
  LARGURA_MINIMA_DA_FAIXA,
  ROTULO_DO_PESO,
  ROTULO_DO_TIPO,
  TIPOS_QUE_PESAM,
  alvoDaDimensao,
} from "@/lib/perfil-alvo";
import { numero } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Edição do perfil-alvo da vaga.
 *
 * O perfil é a régua: é contra ele que a aderência de todo candidato é medida.
 * Por isso a tela não é um formulário de cadastro, é uma tela de calibração —
 * cada dimensão mostra, enquanto se mexe, a faixa que o candidato vai encontrar.
 *
 * "Peso 0" é a única forma de dizer "não entra na conta": o campo de tipo
 * desaparece quando o peso é zero, em vez de oferecer uma combinação que o motor
 * ignora. A dimensão continua listada de propósito — descartada não é esquecida.
 */
export function EditarPerfilAlvo({
  jobId,
  perfil,
  respostasConcluidas,
}: {
  jobId: string;
  perfil: PerfilAlvo;
  respostasConcluidas: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<PerfilAlvo>(() => completar(perfil));
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarSalvamento] = useTransition();
  const router = useRouter();

  /**
   * A ação é chamada à mão, sem `useActionState`: o diálogo tem que fechar
   * QUANDO a gravação confirma, e fechar a partir de um efeito que observa o
   * estado da ação dispara renderização em cascata. Aqui o fechamento acontece
   * no mesmo lugar onde a resposta chega.
   */
  function salvar(dados: FormData) {
    setErro(null);
    iniciarSalvamento(async () => {
      const resultado = await atualizarPerfilDaVaga(jobId, {}, dados);

      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível salvar o perfil-alvo.");
        return;
      }

      setAberto(false);
      toast.success(
        resultado.recalculadas
          ? `Perfil-alvo salvo. ${resultado.recalculadas} ${resultado.recalculadas === 1 ? "resposta recalculada" : "respostas recalculadas"}.`
          : "Perfil-alvo salvo.",
      );
      router.refresh();
    });
  }

  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    // Reabrir depois de desistir tem que mostrar o que está gravado, não o
    // rascunho abandonado da vez anterior.
    if (proximo) {
      setRascunho(completar(perfil));
      setErro(null);
    }
  }

  function ajustar(fator: Fator, mudanca: Partial<PerfilAlvo[Fator]>) {
    setRascunho((atual) => ({
      ...atual,
      [fator]: { ...atual[fator], ...mudanca },
    }));
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            Ajustar
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar o perfil-alvo</DialogTitle>
          <DialogDescription>
            As faixas que esta vaga pede. Mexer aqui muda a régua da aderência —
            e só desta vaga.
          </DialogDescription>
        </DialogHeader>

        {respostasConcluidas > 0 && (
          <p className="rounded-lg border border-marca/30 bg-marca-suave/40 px-3 py-2.5 t-legenda leading-relaxed">
            Esta vaga já tem{" "}
            <strong className="font-medium">
              {respostasConcluidas}{" "}
              {respostasConcluidas === 1 ? "resposta" : "respostas"}
            </strong>
            . Ao salvar, a aderência de todas é recalculada contra as novas
            faixas — a ordem do ranking pode mudar. As respostas em si não são
            tocadas.
          </p>
        )}

        <form action={salvar} className="space-y-4">
          {/* A lista rola por dentro: o cabeçalho e os botões precisam ficar
              onde estão, senão salvar exige rolar até o fim de cinco
              dimensões. */}
          <ul className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {FATORES.map((fator) => {
              const cfg = rascunho[fator];
              const pesa = cfg.peso > 0;
              const alvo = alvoDaDimensao(cfg);

              return (
                <li key={fator} className="rounded-lg border p-3">
                  <input type="hidden" name={`${fator}.tipo`} value={cfg.tipo} />
                  <input type="hidden" name={`${fator}.peso`} value={cfg.peso} />
                  <input
                    type="hidden"
                    name={`${fator}.min`}
                    value={cfg.faixa[0]}
                  />
                  <input
                    type="hidden"
                    name={`${fator}.max`}
                    value={cfg.faixa[1]}
                  />

                  <Faixa
                    compacto
                    dados={{
                      fator,
                      nome: NOMES_DE_FATOR[fator].ui,
                      // No perfil-alvo o marcador mostra o IDEAL, não um
                      // candidato: é o alvo que se está movendo.
                      escore: alvo,
                      faixa: cfg.faixa,
                      ideal: alvo,
                      peso: cfg.peso,
                      tipo: cfg.tipo,
                      dentro: true,
                    }}
                  />

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo
                        rotulo="Importância"
                        htmlFor={`peso-${fator}`}
                      >
                        <select
                          id={`peso-${fator}`}
                          value={cfg.peso}
                          onChange={(e) => {
                            const peso = Number(e.target.value);
                            ajustar(fator, {
                              peso,
                              // O tipo acompanha: peso 0 é "não entra na conta",
                              // e voltar a pesar precisa de um tipo de verdade.
                              tipo:
                                peso === 0
                                  ? "irrelevante"
                                  : cfg.tipo === "irrelevante"
                                    ? "maior_melhor"
                                    : cfg.tipo,
                            });
                          }}
                          className="h-9 w-full rounded-lg border bg-transparent px-2 text-sm"
                        >
                          {[5, 4, 3, 2, 1, 0].map((p) => (
                            <option key={p} value={p}>
                              {ROTULO_DO_PESO[p]}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      {pesa && (
                        <Campo rotulo="Como ler" htmlFor={`tipo-${fator}`}>
                          <select
                            id={`tipo-${fator}`}
                            value={cfg.tipo}
                            onChange={(e) =>
                              ajustar(fator, {
                                tipo: e.target.value as TipoDeDimensao,
                              })
                            }
                            className="h-9 w-full rounded-lg border bg-transparent px-2 text-sm"
                          >
                            {TIPOS_QUE_PESAM.map((t) => (
                              <option key={t} value={t}>
                                {ROTULO_DO_TIPO[t]}
                              </option>
                            ))}
                          </select>
                        </Campo>
                      )}
                    </div>

                    {pesa && (
                      <div className="flex items-end gap-2">
                        <Campo rotulo="De" htmlFor={`min-${fator}`} estreito>
                          <input
                            id={`min-${fator}`}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={cfg.faixa[0]}
                            onChange={(e) =>
                              ajustar(fator, {
                                faixa: [limitar(e.target.value), cfg.faixa[1]],
                              })
                            }
                            className="leitura h-9 w-18 rounded-lg border bg-transparent px-2 text-sm tabular-nums"
                          />
                        </Campo>
                        <Campo rotulo="Até" htmlFor={`max-${fator}`} estreito>
                          <input
                            id={`max-${fator}`}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={cfg.faixa[1]}
                            onChange={(e) =>
                              ajustar(fator, {
                                faixa: [cfg.faixa[0], limitar(e.target.value)],
                              })
                            }
                            className="leitura h-9 w-18 rounded-lg border bg-transparent px-2 text-sm tabular-nums"
                          />
                        </Campo>
                      </div>
                    )}
                  </div>

                  {pesa ? (
                    <p
                      className={cn(
                        "mt-2 t-legenda",
                        cfg.faixa[1] - cfg.faixa[0] < LARGURA_MINIMA_DA_FAIXA
                          ? "text-fora"
                          : "text-muted-foreground",
                      )}
                    >
                      {cfg.faixa[1] - cfg.faixa[0] < LARGURA_MINIMA_DA_FAIXA
                        ? `A faixa precisa ter no mínimo ${LARGURA_MINIMA_DA_FAIXA} pontos — abaixo disso ela separa ruído, não pessoas.`
                        : `Alvo do cálculo: ${numero(alvo, alvo % 1 === 0 ? 0 : 1)}. Fora da faixa custa mais que dentro.`}
                    </p>
                  ) : (
                    <p className="mt-2 t-legenda text-muted-foreground">
                      Fica listada, sem entrar na conta — para ficar claro que foi
                      considerada e descartada, não esquecida.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {erro && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
            >
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => aoMudarAbertura(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pendente} className="gap-1.5">
              {pendente && <Loader2 className="size-3.5 animate-spin" />}
              {pendente ? "Salvando" : "Salvar perfil-alvo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Completa o perfil com as cinco dimensões.
 *
 * `targetProfile` é Json: uma vaga antiga (ou importada) pode não ter todas.
 * A tela da vaga já se defende disso pulando a dimensão ausente; aqui, sem esta
 * garantia, abrir o diálogo quebraria a página inteira num `cfg.peso` de
 * `undefined`.
 */
function completar(perfil: PerfilAlvo): PerfilAlvo {
  return Object.fromEntries(
    FATORES.map((f) => [f, perfil[f] ?? PERFIL_NEUTRO[f]]),
  ) as PerfilAlvo;
}

/** Campo de valor entre 0 e 100 — o intervalo da escala do instrumento. */
function limitar(valor: string) {
  const n = Number(valor);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function Campo({
  rotulo,
  htmlFor,
  children,
  estreito = false,
}: {
  rotulo: string;
  htmlFor: string;
  children: React.ReactNode;
  estreito?: boolean;
}) {
  return (
    <div className={cn("space-y-1", estreito && "shrink-0")}>
      <Label htmlFor={htmlFor} className="etiqueta">
        {rotulo}
      </Label>
      {children}
    </div>
  );
}
