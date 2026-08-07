"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { revogarConvite } from "@/lib/actions/convite";

/**
 * Cancela o acesso de quem foi convidado e ainda não terminou.
 *
 * ─── Por que confirma, e por que a confirmação diz o que faz ──────────────
 * Revogar é irreversível pelo produto: o convite não volta ao ar, e reconvidar
 * emite outro, com token e código novos. Quem estava no meio da prova perde o
 * caminho de volta. Um clique só, num botão pequeno ao lado de uma lista, é
 * pouco para isso.
 *
 * A confirmação muda de texto quando a pessoa ESTÁ respondendo naquele momento,
 * porque as duas situações têm consequências diferentes: cancelar quem nem
 * abriu não custa nada a ninguém; cancelar quem está na metade joga fora o
 * trabalho dela.
 */
export function RevogarConvite({
  invitationId,
  nome,
  respondendo,
}: {
  invitationId: string;
  nome: string;
  respondendo: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, transicao] = useTransition();
  const router = useRouter();

  if (!confirmando) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground"
        onClick={() => setConfirmando(true)}
      >
        Cancelar acesso
      </Button>
    );
  }

  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="t-legenda text-right text-muted-foreground">
        {respondendo
          ? `${nome} está respondendo agora — cancelar descarta o que já foi feito.`
          : `Cancelar o acesso de ${nome}?`}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={pendente}
        onClick={() =>
          transicao(async () => {
            const r = await revogarConvite(invitationId);
            if (r.erro) {
              setErro(r.erro);
              setConfirmando(false);
              return;
            }
            /* O `revalidatePath` da ação sozinho NÃO tira a linha da tela.
               Medido: cinco segundos depois de o banco já estar com o convite
               em REVOKED, a pessoa continuava listada. Botão que parece não
               ter feito nada é botão que se clica de novo — e a segunda vez
               cai no `if (status === "REVOKED") return { ok: true }`, então
               não estraga nada, mas o RH fica sem saber se funcionou.

               `router.refresh()` é o que o resto do projeto já faz depois de
               ação que muda lista (editar-bateria, cadastrar-candidato,
               editar-perfil-alvo). Aqui pelo mesmo motivo. */
            router.refresh();
          })
        }
      >
        {pendente ? "Cancelando…" : "Cancelar acesso"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
        Voltar
      </Button>
      {erro && (
        <span className="t-legenda text-fora" role="alert">
          {erro}
        </span>
      )}
    </span>
  );
}
