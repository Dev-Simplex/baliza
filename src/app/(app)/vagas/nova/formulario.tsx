"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarVaga, type EstadoDaVaga } from "@/lib/actions/vaga";
import { ROTULO_DE_MODELO, ROTULO_DE_SENIORIDADE } from "@/lib/formato";
import { cn } from "@/lib/utils";

type PresetResumido = {
  id: string;
  nome: string;
  familia: string;
  nota: string;
};

/**
 * As duas formas de a vaga receber gente, e a diferença entre elas é de
 * processo, não de recurso: na aberta o candidato se cadastra sozinho; na
 * fechada o RH cadastra primeiro e só então manda o acesso.
 */
const MODOS_DE_ENTRADA = [
  {
    id: "aberta" as const,
    nome: "Aberta",
    nota: "Qualquer pessoa com o link responde e se cadastra sozinha. É o link que você cola no anúncio.",
  },
  {
    id: "fechada" as const,
    nome: "Por convite",
    nota: "Só responde quem você cadastrar. O link público recusa quem não foi convidado.",
  },
];

export function FormularioDeVaga({ presets }: { presets: PresetResumido[] }) {
  const [estado, acao, pendente] = useActionState(criarVaga, {} as EstadoDaVaga);
  const [escolhido, setEscolhido] = useState(presets[0]?.id ?? "");
  const [entrada, setEntrada] = useState<"aberta" | "fechada">("aberta");

  const notaDoEscolhido = presets.find((p) => p.id === escolhido)?.nota;

  return (
    <form action={acao} className="mt-8 space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">A vaga</h2>

        <div className="space-y-2">
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            name="titulo"
            required
            placeholder="Executivo de Vendas — Prospecção"
            aria-invalid={Boolean(estado.campos?.titulo)}
          />
          {estado.campos?.titulo && (
            <p className="text-xs text-destructive">{estado.campos.titulo}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input id="departamento" name="departamento" placeholder="Comercial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input id="local" name="local" placeholder="São Paulo, SP" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="senioridade">Senioridade</Label>
            <select
              id="senioridade"
              name="senioridade"
              defaultValue="MID"
              className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
            >
              {Object.entries(ROTULO_DE_SENIORIDADE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo de trabalho</Label>
            <select
              id="modelo"
              name="modelo"
              defaultValue="ONSITE"
              className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
            >
              {Object.entries(ROTULO_DE_MODELO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            name="descricao"
            rows={4}
            placeholder="O que a pessoa vai fazer no dia a dia."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requisitos">Requisitos</Label>
          <Textarea
            id="requisitos"
            name="requisitos"
            rows={3}
            placeholder="Experiência, formação, ferramentas."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Quem pode responder</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dá para mudar depois, na página da vaga.
          </p>
        </div>

        <input type="hidden" name="entrada" value={entrada} />

        <div className="grid gap-2 sm:grid-cols-2">
          {MODOS_DE_ENTRADA.map((modo) => {
            const ativo = entrada === modo.id;
            return (
              <button
                key={modo.id}
                type="button"
                onClick={() => setEntrada(modo.id)}
                aria-pressed={ativo}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  ativo
                    ? "border-marca bg-marca-forte/8"
                    : "hover:border-marca/40 hover:bg-secondary/50",
                )}
              >
                <span className="block text-sm font-medium">{modo.nome}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {modo.nota}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Perfil-alvo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pontos de partida editáveis, não verdades. Depois de criar a vaga
            você ajusta cada faixa.
          </p>
        </div>

        <input type="hidden" name="preset" value={escolhido} />

        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((preset) => {
            const ativo = escolhido === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setEscolhido(preset.id)}
                aria-pressed={ativo}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                  "",
                  ativo
                    ? "border-marca bg-marca-forte/8"
                    : "hover:border-marca/40 hover:bg-secondary/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]",
                    ativo ? "border-marca bg-marca-forte" : "border-border",
                  )}
                >
                  {ativo && <Check className="size-2.5 text-background" />}
                </span>
                <span className="min-w-0">
                  <span className="block t-corpo-sm font-medium">
                    {preset.nome}
                  </span>
                  <span className="etiqueta">{preset.familia}</span>
                </span>
              </button>
            );
          })}
        </div>

        {notaDoEscolhido && (
          <p className="rounded-lg border-l-2 border-marca bg-secondary/60 px-4 py-3 t-corpo-sm leading-relaxed text-muted-foreground">
            {notaDoEscolhido}
          </p>
        )}
      </section>

      {estado.erro && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {estado.erro}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-6">
        <Button type="submit" disabled={pendente} className="gap-2">
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Criando
            </>
          ) : (
            "Criar vaga"
          )}
        </Button>
      </div>
    </form>
  );
}
