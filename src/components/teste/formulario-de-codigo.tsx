"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { entrarPeloCodigo, type EstadoDaEntrada } from "@/lib/actions/avaliacao";

/**
 * Entrada pelos 4 dígitos.
 *
 * Quatro campos separados, e não um só: é assim que a pessoa espera digitar um
 * código curto, o dedo não erra a posição no celular e o teclado numérico abre
 * sozinho.
 *
 * Os quatro campos compartilham o nome `codigo` de propósito. O `FormData` de
 * um formulário nativo guarda os valores repetidos na ordem do documento, então
 * o servidor remonta o código com `getAll(...).join("")` — e a tela funciona
 * mesmo no instante anterior à hidratação, que é justamente quando alguém
 * apressado já está digitando. Com um campo escondido alimentado pelo estado do
 * React isso não valia: antes de hidratar, o escondido ia vazio.
 *
 * O que NÃO tem aqui, de propósito: envio automático ao completar o quarto
 * dígito. São 6 tentativas por hora por IP, e um dígito errado gastaria uma
 * delas antes de a pessoa ter chance de conferir o que digitou.
 */
export function FormularioDeCodigo() {
  const [estado, acao, pendente] = useActionState(
    entrarPeloCodigo,
    {} as EstadoDaEntrada,
  );
  const [digitos, setDigitos] = useState(["", "", "", ""]);
  const campos = useRef<Array<HTMLInputElement | null>>([]);

  const codigo = digitos.join("");

  // Focar SELECIONANDO: sem isso, trocar um dígito já preenchido obrigava a
  // apagar antes de digitar, e o campo cheio simplesmente engolia a tecla.
  function focar(posicao: number) {
    const campo = campos.current[posicao];
    campo?.focus();
    campo?.select();
  }

  // Código errado devolve o foco para o começo: a pessoa erra um dígito e
  // quer redigitar, não caçar com o dedo qual dos quatro campos estava errado.
  useEffect(() => {
    if (estado.erro || estado.campos?.codigo) focar(0);
  }, [estado]);

  function escrever(posicao: number, valor: string) {
    const limpo = valor.replace(/\D/g, "");

    if (!limpo) {
      setDigitos((d) => d.map((v, i) => (i === posicao ? "" : v)));
      return;
    }

    // Colar o código inteiro preenche tudo, venha ele de onde vier: o WhatsApp
    // entrega "1234", mas também "Seu código: 12-34" — a limpeza acima resolve
    // as duas. Com 4 dígitos ou mais, é o código completo e vale do começo;
    // menos que isso, entra a partir do campo tocado.
    if (limpo.length > 1) {
      const inicio = limpo.length >= 4 ? 0 : posicao;
      const novos = limpo.slice(0, 4 - inicio).split("");
      setDigitos((d) =>
        d.map((v, i) =>
          i >= inicio && i - inicio < novos.length ? novos[i - inicio] : v,
        ),
      );
      focar(Math.min(inicio + novos.length, 3));
      return;
    }

    setDigitos((d) => d.map((v, i) => (i === posicao ? limpo : v)));
    if (posicao < 3) focar(posicao + 1);
  }

  function aoTeclar(posicao: number, evento: React.KeyboardEvent) {
    // Backspace num campo vazio volta para o anterior — senão a pessoa fica
    // presa apagando o nada.
    if (evento.key === "Backspace" && !digitos[posicao] && posicao > 0) {
      evento.preventDefault();
      setDigitos((d) => d.map((v, i) => (i === posicao - 1 ? "" : v)));
      focar(posicao - 1);
    }
    if (evento.key === "ArrowLeft" && posicao > 0) focar(posicao - 1);
    if (evento.key === "ArrowRight" && posicao < 3) focar(posicao + 1);
  }

  const temErro = Boolean(estado.erro || estado.campos?.codigo);

  return (
    <form action={acao} className="mt-6">
      <div
        className="flex justify-center gap-2.5"
        role="group"
        aria-label="Código de acesso de 4 dígitos"
        aria-describedby={temErro ? "erro-do-codigo" : undefined}
      >
        {[0, 1, 2, 3].map((posicao) => (
          <input
            key={posicao}
            ref={(el) => {
              campos.current[posicao] = el;
            }}
            name="codigo"
            type="text"
            value={digitos[posicao]}
            onChange={(e) => escrever(posicao, e.target.value)}
            onKeyDown={(e) => aoTeclar(posicao, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            // `pattern` não valida nada aqui — é o que faz o iPhone antigo abrir
            // o teclado de números em vez do alfabético.
            pattern="[0-9]*"
            autoComplete={posicao === 0 ? "one-time-code" : "off"}
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label={`Dígito ${posicao + 1} de 4`}
            aria-invalid={temErro}
            className="leitura h-16 w-14 rounded-xl border bg-background text-center text-2xl tabular-nums outline-none transition-colors focus:border-marca-forte focus:ring-2 focus:ring-marca-forte/20 aria-invalid:border-destructive/60"
          />
        ))}
      </div>

      {temErro && (
        <p
          id="erro-do-codigo"
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm leading-relaxed text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {estado.erro ?? estado.campos?.codigo}
        </p>
      )}

      <Button
        type="submit"
        disabled={codigo.length !== 4 || pendente}
        size="lg"
        className="mt-6 h-11 w-full gap-2 t-corpo"
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
