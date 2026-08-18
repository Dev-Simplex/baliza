"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, ShieldOff, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  alterarAtivacao,
  alterarPapel,
  type EstadoDaEquipe,
} from "@/lib/actions/equipe";
import { ROTULO_DE_PAPEL, iniciais } from "@/lib/formato";
import { DESCRICAO_DE_PERMISSAO, permissoesDe } from "@/lib/permissoes";
import type { UserRole } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type PessoaDaEquipe = {
  id: string;
  nome: string;
  email: string;
  papel: UserRole;
  ativo: boolean;
  /** Último acesso, já formatado no servidor. */
  ultimoAcesso: string | null;
};

/**
 * Quem tem acesso, e com qual papel.
 *
 * ─── Por que a lista de permissões aparece na tela ─────────────────────────
 * O nome do papel não diz o que ele faz. "ADMIN" e "RECRUITER" são rótulos que
 * cada produto usa de um jeito, e quem escolhe entre os dois está tomando uma
 * decisão sobre dado sensível de candidato sem saber o que está decidindo.
 * Então a mudança mostra, em texto, o que a pessoa passa a poder fazer — antes
 * de salvar, não depois.
 *
 * ─── Desabilitar aqui é gentileza, não trava ───────────────────────────────
 * As quatro regras (não mexer em si mesmo, não conceder acima do próprio papel,
 * não mexer em quem está acima, não deixar a empresa sem dono) valem no
 * servidor, em `lib/actions/equipe.ts`. O que esta tela faz é não oferecer o
 * que vai ser recusado — botão que sempre falha é pior que botão que não está lá.
 */
export function GestaoDeEquipe({
  pessoas,
  meuId,
  papeisQuePossoConceder,
}: {
  pessoas: PessoaDaEquipe[];
  meuId: string;
  papeisQuePossoConceder: UserRole[];
}) {
  return (
    <ul className="divide-y">
      {pessoas.map((pessoa) => (
        <LinhaDaEquipe
          key={pessoa.id}
          pessoa={pessoa}
          souEu={pessoa.id === meuId}
          papeisQuePossoConceder={papeisQuePossoConceder}
        />
      ))}
    </ul>
  );
}

function LinhaDaEquipe({
  pessoa,
  souEu,
  papeisQuePossoConceder,
}: {
  pessoa: PessoaDaEquipe;
  souEu: boolean;
  papeisQuePossoConceder: UserRole[];
}) {
  const [estadoDoPapel, salvarPapel, salvandoPapel] = useActionState<
    EstadoDaEquipe,
    FormData
  >(alterarPapel, {});
  const [estadoDaAtivacao, salvarAtivacao, salvandoAtivacao] = useActionState<
    EstadoDaEquipe,
    FormData
  >(alterarAtivacao, {});

  const formularioDoPapel = useRef<HTMLFormElement>(null);

  // Mudança de papel não tem botão "salvar": escolher já é a intenção inteira.
  // Um select seguido de um botão faria a metade das mudanças ficarem pela
  // metade — escolhidas na tela e não gravadas.
  useEffect(() => {
    if (estadoDoPapel.erro) formularioDoPapel.current?.reset();
  }, [estadoDoPapel.erro]);

  // Quem está acima de mim não aparece como editável: o servidor recusaria.
  const possoEditar =
    !souEu && papeisQuePossoConceder.includes(pessoa.papel);

  const erro = estadoDoPapel.erro ?? estadoDaAtivacao.erro;

  return (
    <li className={cn("px-5 py-4", !pessoa.ativo && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden
          className="t-legenda grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground"
        >
          {iniciais(pessoa.nome)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {pessoa.nome}
            {souEu && <span className="etiqueta ml-2">você</span>}
            {!pessoa.ativo && (
              <span className="etiqueta ml-2 text-fora">acesso desligado</span>
            )}
          </p>
          <p className="t-legenda truncate text-muted-foreground">
            {pessoa.email}
            {pessoa.ultimoAcesso && ` · último acesso ${pessoa.ultimoAcesso}`}
          </p>
        </div>

        {possoEditar ? (
          <form action={salvarPapel} ref={formularioDoPapel}>
            <input type="hidden" name="usuarioId" value={pessoa.id} />
            <label className="sr-only" htmlFor={`papel-${pessoa.id}`}>
              Papel de {pessoa.nome}
            </label>
            <select
              id={`papel-${pessoa.id}`}
              name="papel"
              defaultValue={pessoa.papel}
              disabled={salvandoPapel || !pessoa.ativo}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm disabled:opacity-50"
            >
              {papeisQuePossoConceder.map((papel) => (
                <option key={papel} value={papel}>
                  {ROTULO_DE_PAPEL[papel] ?? papel}
                </option>
              ))}
            </select>
          </form>
        ) : (
          <span className="etiqueta shrink-0">
            {ROTULO_DE_PAPEL[pessoa.papel] ?? pessoa.papel}
          </span>
        )}

        {possoEditar && (
          <form action={salvarAtivacao}>
            <input type="hidden" name="usuarioId" value={pessoa.id} />
            <input
              type="hidden"
              name="ativo"
              value={pessoa.ativo ? "nao" : "sim"}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={salvandoAtivacao}
              className="gap-1.5"
            >
              {pessoa.ativo ? (
                <>
                  <ShieldOff className="size-3.5" />
                  Desligar
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" />
                  Religar
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* O que este papel deixa fazer, em texto. Ver a nota do componente. */}
      <ul className="mt-2.5 ml-11 flex flex-wrap gap-x-4 gap-y-1">
        {permissoesDe(pessoa.papel).map((permissao) => (
          <li
            key={permissao}
            className="t-legenda flex items-center gap-1 text-muted-foreground"
          >
            <Check className="size-3 shrink-0 text-dentro" aria-hidden />
            {DESCRICAO_DE_PERMISSAO[permissao]}
          </li>
        ))}
      </ul>

      {erro && (
        <p role="alert" className="t-legenda mt-2 ml-11 text-fora">
          {erro}
        </p>
      )}
    </li>
  );
}
