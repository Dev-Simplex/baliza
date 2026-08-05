"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Copiar para a área de transferência.
 *
 * `navigator.clipboard` só existe em origem SEGURA — https ou localhost. Quem
 * abre o painel pelo IP da rede (`http://192.168.0.10:3300`) não tem a API, e o
 * botão principal do produto caía direto no erro. O caminho legado do
 * `execCommand` continua valendo em http e é o que salva esse caso.
 *
 * Estava reimplementado em cada tela que tinha um botão de copiar, com uma
 * cadeia de tentativas diferente em cada uma — então o mesmo gesto funcionava
 * numa tela e falhava na outra, dependendo de onde tinha sido escrito.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Permissão negada: ainda dá para tentar o caminho legado abaixo.
    }
  }

  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    // Fora da tela, mas selecionável: `display:none` não copia.
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "-1000px";
    document.body.appendChild(campo);
    campo.select();
    const deuCerto = document.execCommand("copy");
    document.body.removeChild(campo);
    return deuCerto;
  } catch {
    return false;
  }
}

/**
 * Botão de copiar.
 *
 * `confirmacao` é a frase inteira do aviso, não só o nome da coisa: "Mensagem
 * copiado" é o preço de montar a frase com um rótulo solto.
 */
export function BotaoCopiar({
  texto,
  confirmacao,
  children,
  variant = "secondary",
  size = "sm",
  className,
  rotuloAcessivel,
  aoFalhar,
}: {
  texto: string;
  confirmacao: string;
  children?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  /** O que o botão copia, dito por inteiro — "Copiar" sozinho não diz o quê. */
  rotuloAcessivel?: string;
  /** Última cartada de quem chama — normalmente selecionar o texto na tela. */
  aoFalhar?: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function aoClicar() {
    if (await copiarTexto(texto)) {
      setCopiado(true);
      toast.success(confirmacao);
      window.setTimeout(() => setCopiado(false), 2000);
      return;
    }

    if (aoFalhar) {
      aoFalhar();
      toast.error("Não foi possível copiar sozinho. O texto está selecionado — use Ctrl+C.");
      return;
    }
    toast.error("Não foi possível copiar. Selecione e copie manualmente.");
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={aoClicar}
      className={className}
      aria-label={rotuloAcessivel}
      title={rotuloAcessivel}
    >
      {copiado ? (
        <Check className="size-3.5 text-dentro" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {children}
    </Button>
  );
}
