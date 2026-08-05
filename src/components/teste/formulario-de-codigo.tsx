"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { entrarPeloCodigo, type EstadoDaEntrada } from "@/lib/actions/avaliacao";

/**
 * Entrada pelos 4 dígitos.
 *
 * Quatro campos separados, e não um só: é assim que a pessoa espera digitar um
 * código curto, o dedo não erra a posição no celular e o teclado numérico abre
 * sozinho. O valor real vai num campo escondido — o formulário continua sendo
 * um formulário comum, que funciona mesmo antes do JavaScript carregar.
 */
export function FormularioDeCodigo() {
  const [estado, acao, pendente] = useActionState(
    entrarPeloCodigo,
    {} as EstadoDaEntrada,
  );
  const [digitos, setDigitos] = useState(["", "", "", ""]);
  const campos = useRef<Array<HTMLInputElement | null>>([]);

  const codigo = digitos.join("");

  function escrever(posicao: number, valor: string) {
    const limpo = valor.replace(/\D/g, "");
    if (!limpo) {
      setDigitos((d) => d.map((v, i) => (i === posicao ? "" : v)));
      return;
    }

    // Colar o código inteiro em qualquer campo preenche todos.
    if (limpo.length > 1) {
      const novos = limpo.slice(0, 4).split("");
      setDigitos([0, 1, 2, 3].map((i) => novos[i] ?? ""));
      campos.current[Math.min(novos.length, 3)]?.focus();
      return;
    }

    setDigitos((d) => d.map((v, i) => (i === posicao ? limpo : v)));
    if (posicao < 3) campos.current[posicao + 1]?.focus();
  }

  function aoTeclar(posicao: number, evento: React.KeyboardEvent) {
    // Backspace num campo vazio volta para o anterior — senão a pessoa fica
    // presa apagando o nada.
    if (evento.key === "Backspace" && !digitos[posicao] && posicao > 0) {
      campos.current[posicao - 1]?.focus();
    }
    if (evento.key === "ArrowLeft" && posicao > 0) campos.current[posicao - 1]?.focus();
    if (evento.key === "ArrowRight" && posicao < 3) campos.current[posicao + 1]?.focus();
  }

  return (
    <form action={acao} className="mt-6">
      <input type="hidden" name="codigo" value={codigo} />

      <div className="flex justify-center gap-2.5" role="group" aria-label="Código de acesso">
        {[0, 1, 2, 3].map((posicao) => (
          <input
            key={posicao}
            ref={(el) => {
              campos.current[posicao] = el;
            }}
            value={digitos[posicao]}
            onChange={(e) => escrever(posicao, e.target.value)}
            onKeyDown={(e) => aoTeclar(posicao, e)}
            inputMode="numeric"
            autoComplete={posicao === 0 ? "one-time-code" : "off"}
            aria-label={`Dígito ${posicao + 1}`}
            className="leitura h-16 w-14 rounded-xl border bg-background text-center text-2xl tabular-nums outline-none transition-colors focus:border-marca-forte focus:ring-2 focus:ring-marca-forte/20"
          />
        ))}
      </div>

      {estado.campos?.codigo && (
        <p className="mt-3 text-center text-xs text-destructive">
          {estado.campos.codigo}
        </p>
      )}

      {estado.erro && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {estado.erro}
        </p>
      )}

      <Button
        type="submit"
        disabled={codigo.length !== 4 || pendente}
        className="mt-6 w-full gap-2"
      >
        {pendente ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
