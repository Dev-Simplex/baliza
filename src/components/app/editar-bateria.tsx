"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { SeletorDeBateria } from "@/components/app/seletor-de-bateria";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { atualizarBateriaDaVaga } from "@/lib/actions/vaga";
import type { Teste } from "@/lib/instrument/baterias";

/**
 * Troca os testes de uma vaga que já existe.
 *
 * O aviso do topo é o motivo de esta tela existir separada da edição de
 * perfil-alvo: lá, salvar recalcula todo mundo contra a régua nova, porque a
 * conta se refaz a partir de respostas que já estão gravadas. Aqui não se refaz
 * nada — a prova de quem já foi convidado é a que ele começou a responder. O
 * que muda vale dos próximos convites em diante, e dizer isso ANTES de salvar é
 * a diferença entre uma escolha e uma surpresa.
 */
export function EditarBateria({
  jobId,
  bateria,
  aguardandoResposta,
}: {
  jobId: string;
  bateria: Teste[];
  aguardandoResposta: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Teste[]>(bateria);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarSalvamento] = useTransition();
  const router = useRouter();

  /**
   * A ação é chamada à mão, sem `useActionState`, pelo mesmo motivo de
   * `EditarPerfilAlvo`: o diálogo tem que fechar QUANDO a gravação confirma, e
   * fechar a partir de um efeito que observa o estado dispara renderização em
   * cascata.
   */
  function salvar() {
    setErro(null);
    iniciarSalvamento(async () => {
      const resultado = await atualizarBateriaDaVaga(jobId, rascunho);

      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível salvar os testes.");
        return;
      }

      setAberto(false);
      toast.success("Testes da vaga salvos.");
      router.refresh();
    });
  }

  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    // Reabrir depois de desistir mostra o que está gravado, não o rascunho
    // abandonado da vez anterior.
    if (proximo) {
      setRascunho(bateria);
      setErro(null);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            Trocar
          </Button>
        }
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testes desta vaga</DialogTitle>
          <DialogDescription>
            Cada teste marcado vira uma etapa separada da prova, na ordem em que
            aparecem aqui.
          </DialogDescription>
        </DialogHeader>

        {aguardandoResposta > 0 && (
          <p className="rounded-lg border border-marca/30 bg-marca-suave/40 px-3 py-2.5 t-legenda leading-relaxed">
            <strong className="font-medium">
              {aguardandoResposta}{" "}
              {aguardandoResposta === 1 ? "pessoa" : "pessoas"}
            </strong>{" "}
            {aguardandoResposta === 1 ? "já tem" : "já têm"} acesso e ainda não{" "}
            {aguardandoResposta === 1 ? "terminou" : "terminaram"}. A prova{" "}
            {aguardandoResposta === 1 ? "dela" : "delas"} não muda: a bateria foi
            copiada quando o acesso foi criado. O que você marcar aqui vale dos
            próximos convites em diante.
          </p>
        )}

        <SeletorDeBateria
          valor={rascunho}
          aoMudar={setRascunho}
          desabilitado={pendente}
        />

        {erro && (
          <p role="alert" className="t-legenda text-destructive">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAberto(false)}
            disabled={pendente}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={salvar}
            disabled={pendente || rascunho.length === 0}
            className="gap-2"
          >
            {pendente && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
