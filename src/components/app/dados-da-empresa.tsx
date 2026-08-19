"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  atualizarEmpresa,
  atualizarRetencao,
  type EstadoDaEmpresa,
} from "@/lib/actions/empresa";
import { PRAZOS_DE_RETENCAO } from "@/lib/prazos-de-retencao";

export type Empresa = {
  nome: string;
  slug: string;
  segmento: string | null;
  site: string | null;
  documento: string | null;
  retencaoEmMeses: number;
};

/**
 * Os dados da empresa que o candidato vê.
 *
 * ─── Por que o identificador não é editável ────────────────────────────────
 * O `slug` é único no sistema inteiro e entra em endereço. Deixar editar aqui
 * criaria a possibilidade de quebrar um link que já está na mão de alguém —
 * inclusive de um candidato no meio do processo. Ele aparece porque quem
 * administra precisa saber qual é; não aparece como campo porque mudá-lo é
 * outra operação, com outras consequências.
 */
export function DadosDaEmpresa({
  empresa,
  podeEditar,
}: {
  empresa: Empresa;
  podeEditar: boolean;
}) {
  const [estado, salvar, salvando] = useActionState<EstadoDaEmpresa, FormData>(
    atualizarEmpresa,
    {},
  );

  if (!podeEditar) {
    return (
      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Leitura rotulo="Nome" valor={empresa.nome} />
        <Leitura rotulo="Identificador" valor={empresa.slug} monospace />
        <Leitura rotulo="Segmento" valor={empresa.segmento ?? "—"} />
        <Leitura rotulo="Site" valor={empresa.site ?? "—"} />
      </dl>
    );
  }

  return (
    <form action={salvar} className="mt-5 grid gap-4 sm:grid-cols-2">
      <Campo
        id="nome"
        rotulo="Nome"
        valor={empresa.nome}
        dica="Aparece para o candidato no convite e no relatório."
        obrigatorio
      />
      <div>
        <Label>Identificador</Label>
        <p className="leitura mt-2 text-sm text-muted-foreground">{empresa.slug}</p>
        <p className="t-legenda mt-1 text-muted-foreground">
          Entra em endereço. Mudar quebraria links já entregues.
        </p>
      </div>
      <Campo id="segmento" rotulo="Segmento" valor={empresa.segmento ?? ""} />
      <Campo
        id="site"
        rotulo="Site"
        valor={empresa.site ?? ""}
        dica="Com https://"
        tipo="url"
      />
      <Campo
        id="documento"
        rotulo="CNPJ"
        valor={empresa.documento ?? ""}
        dica="Opcional."
      />

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
        {estado.ok && (
          <span className="t-corpo-sm flex items-center gap-1.5 text-dentro">
            <Check className="size-4" />
            Salvo
          </span>
        )}
        {estado.erro && (
          <span role="alert" className="t-corpo-sm text-fora">
            {estado.erro}
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * O prazo em que a resposta bruta do candidato é apagada.
 *
 * Separado do formulário da empresa de propósito, e não por organização visual:
 * são permissões diferentes (`empresa:editar` contra `retencao:configurar`), e um
 * ADMIN pode editar o nome da empresa sem poder mexer no prazo. Um formulário só
 * teria que decidir o que fazer com metade dos campos desabilitados.
 */
export function PrazoDeRetencao({
  meses,
  podeEditar,
}: {
  meses: number;
  podeEditar: boolean;
}) {
  const [estado, salvar, salvando] = useActionState<EstadoDaEmpresa, FormData>(
    atualizarRetencao,
    {},
  );

  if (!podeEditar) {
    return (
      <p className="mt-4 t-corpo">
        As respostas brutas são apagadas <strong>{meses} meses</strong> depois de
        cada avaliação. Só quem é dono da conta muda esse prazo.
      </p>
    );
  }

  return (
    <form action={salvar} className="mt-4">
      <Label htmlFor="meses">Apagar as respostas brutas depois de</Label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <select
          id="meses"
          name="meses"
          defaultValue={meses}
          disabled={salvando}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          {PRAZOS_DE_RETENCAO.map((p) => (
            <option key={p} value={p}>
              {p} meses
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" disabled={salvando}>
          {salvando ? "Salvando…" : "Alterar prazo"}
        </Button>
        {estado.ok && (
          <span className="t-corpo-sm flex items-center gap-1.5 text-dentro">
            <Check className="size-4" />
            Salvo
          </span>
        )}
        {estado.erro && (
          <span role="alert" className="t-corpo-sm text-fora">
            {estado.erro}
          </span>
        )}
      </div>

      {/* O aviso é obrigatório, não decorativo: encurtar apaga o intervalo
          inteiro entre o prazo antigo e o novo na próxima manutenção. */}
      <p className="t-legenda mt-3 leading-relaxed text-muted-foreground">
        Encurtar o prazo apaga, na próxima manutenção, tudo que já passou do prazo
        novo — e resposta bruta apagada não volta. O resultado consolidado e o
        relatório continuam; o que some é a resposta item a item.
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  dica,
  tipo = "text",
  obrigatorio = false,
}: {
  id: string;
  rotulo: string;
  valor: string;
  dica?: string;
  tipo?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        name={id}
        type={tipo}
        defaultValue={valor}
        required={obrigatorio}
        className="mt-2"
      />
      {dica && <p className="t-legenda mt-1 text-muted-foreground">{dica}</p>}
    </div>
  );
}

function Leitura({
  rotulo,
  valor,
  monospace = false,
}: {
  rotulo: string;
  valor: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <dt className="etiqueta">{rotulo}</dt>
      <dd className={monospace ? "leitura mt-1.5 text-sm" : "mt-1.5 text-sm"}>
        {valor}
      </dd>
    </div>
  );
}
