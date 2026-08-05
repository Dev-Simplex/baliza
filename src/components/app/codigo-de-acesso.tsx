"use client";

import { BotaoCopiar } from "@/components/app/copiar";

/**
 * Endereço do código SEM o esquema — este é para ser dito em voz alta junto com
 * o código, e ninguém dita "agá-tê-tê-pê-dois-pontos-barra-barra".
 */
function enderecoParaDitar(baseDoSite: string) {
  return `${baseDoSite.replace(/^https?:\/\//, "")}/acesso`;
}

/**
 * A mensagem pronta para mandar no WhatsApp.
 *
 * Aqui o esquema ENTRA, ao contrário do endereço que aparece na tela: esta
 * frase vai ser colada num aplicativo de mensagem, e sem `http://` o endereço
 * não vira link clicável — o candidato receberia um texto para digitar à mão.
 *
 * Os 4 dígitos sozinhos não servem para nada: quem recebe não sabe ONDE
 * digitar. É por isso que copiar o código oferece a frase inteira, e a frase é
 * a mesma em toda tela que mostra um código.
 */
export function mensagemDeAcesso(baseDoSite: string, codigo: string) {
  return `Entre em ${baseDoSite}/acesso e digite o código ${codigo}`;
}

/**
 * O código de 4 dígitos e as duas formas de copiá-lo.
 *
 * `variante="detalhe"` é a do diálogo de cadastro, onde o RH está decidindo como
 * entregar o acesso: as duas opções aparecem escritas, sem menu, porque é o
 * momento da escolha. `variante="linha"` é a da lista "Aguardando resposta", que
 * é superfície de consulta — ali cabe um botão só, e ele copia a frase inteira,
 * que é o que se manda para alguém que perdeu o acesso.
 */
export function CodigoDeAcesso({
  codigo,
  baseDoSite,
  de,
  variante = "detalhe",
}: {
  codigo: string;
  baseDoSite: string;
  /** Nome de quem é o código, para o rótulo acessível na lista. */
  de?: string;
  variante?: "detalhe" | "linha";
}) {
  const mensagem = mensagemDeAcesso(baseDoSite, codigo);

  if (variante === "linha") {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="leitura rounded bg-secondary/60 px-2 py-1 text-sm tabular-nums tracking-[0.2em]">
          {codigo}
        </span>
        <BotaoCopiar
          texto={mensagem}
          confirmacao="Mensagem copiada"
          variant="ghost"
          rotuloAcessivel={`Copiar mensagem de acesso${de ? ` de ${de}` : ""}: endereço e código`}
        >
          Copiar
        </BotaoCopiar>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="etiqueta w-16 shrink-0">Código</span>
      <span className="leitura text-xl tabular-nums tracking-[0.25em]">
        {codigo}
      </span>

      <div className="ml-auto flex shrink-0 gap-1.5">
        <BotaoCopiar
          texto={mensagem}
          confirmacao="Mensagem copiada"
          rotuloAcessivel="Copiar mensagem com o endereço e o código"
        >
          Copiar mensagem
        </BotaoCopiar>
        <BotaoCopiar
          texto={codigo}
          confirmacao="Código copiado"
          variant="ghost"
          rotuloAcessivel="Copiar somente os 4 dígitos"
        >
          Só o código
        </BotaoCopiar>
      </div>

      {/* A instrução mora COM o código, em linha inteira: é ela que explica por
          que copiar a mensagem é o caminho normal. */}
      <p className="w-full t-legenda break-words text-muted-foreground">
        digite em{" "}
        <span className="leitura">{enderecoParaDitar(baseDoSite)}</span>
      </p>
    </div>
  );
}
