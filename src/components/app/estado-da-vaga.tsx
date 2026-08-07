"use client";

import { useTransition } from "react";
import { CircleCheck, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { alternarModoDaVaga, mudarStatusDaVaga } from "@/lib/actions/vaga";

type Status = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";

/**
 * Os dois controles que faltavam para o RH terminar o trabalho sozinho.
 *
 * O backend dos dois já existia inteiro — `alternarModoDaVaga` estava pronta,
 * com escopo, auditoria e revalidação, e sem um único consumidor; e o status da
 * vaga só era escrito no `"OPEN"` da criação. Faltava a tela.
 *
 * São coisas diferentes de propósito:
 *   · MODO   — quem pode responder: qualquer um com o link, ou só convidado.
 *   · STATUS — se o processo ainda está de pé.
 * Fechar o link porque o anúncio vazou não é a mesma coisa que encerrar a vaga
 * porque já contratou, e juntar os dois num botão só obrigaria a explicar
 * depois qual deles a pessoa quis.
 */
export function EstadoDaVaga({
  jobId,
  status,
  aberta,
}: {
  jobId: string;
  status: Status;
  aberta: boolean;
}) {
  const [pendente, transicao] = useTransition();

  const encerrada = status === "CLOSED";
  const pausada = status === "PAUSED";

  const mudar = (novo: Status) =>
    transicao(async () => {
      await mudarStatusDaVaga(jobId, novo as "OPEN" | "PAUSED" | "CLOSED");
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Modo: só faz sentido enquanto a vaga recebe gente. */}
      {!encerrada && (
        <Button
          variant="outline"
          size="sm"
          disabled={pendente}
          onClick={() =>
            transicao(async () => {
              await alternarModoDaVaga(jobId, !aberta);
            })
          }
        >
          {aberta ? "Fechar para convidados" : "Abrir ao público"}
        </Button>
      )}

      {!encerrada && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={pendente}
          onClick={() => mudar(pausada ? "OPEN" : "PAUSED")}
        >
          {pausada ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {pausada ? "Retomar" : "Pausar"}
        </Button>
      )}

      {encerrada ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={pendente}
          onClick={() => mudar("OPEN")}
        >
          <Play className="size-3.5" />
          Reabrir
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          disabled={pendente}
          onClick={() => mudar("CLOSED")}
        >
          <CircleCheck className="size-3.5" />
          Encerrar
        </Button>
      )}
    </div>
  );
}
