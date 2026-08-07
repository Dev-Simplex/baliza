"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode, UserPlus } from "lucide-react";

import { BotaoCopiar } from "@/components/app/copiar";
import {
  CodigoDeAcesso,
  mensagemDeAcesso,
} from "@/components/app/codigo-de-acesso";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convidarPorEmail, type EstadoDoConvite } from "@/lib/actions/convite";

/**
 * Cadastro do candidato pelo RH — o primeiro passo da vaga por convite.
 *
 * Cadastrar e entregar o acesso são o MESMO momento, e por isso são a mesma
 * tela: assim que a pessoa entra, aparecem as três portas (link, QR e código),
 * e o RH escolhe ali como vai entregar. Separar em duas telas produziria a
 * pergunta "cadastrei, e agora?".
 *
 * As três vias abrem a mesma prova. O código não é senha — é a via que dá para
 * ditar no telefone.
 */
export function CadastrarCandidato({
  jobId,
  tituloDaVaga,
  baseDoSite,
  tempoDaProva,
}: {
  jobId: string;
  tituloDaVaga: string;
  baseDoSite: string;
  /**
   * O tempo REAL desta bateria ("cerca de 23 min"), calculado pela página da
   * vaga. Era literal "cerca de 8 minutos" aqui dentro — número que não batia
   * nem com a bateria padrão (6 min) e que ficava a 15 minutos da verdade numa
   * bateria completa. Quem abre o link lê o tempo certo na tela de abertura, e
   * a diferença entre o prometido e o lido é o que faz desistir no meio — e
   * prova incompleta não vira relatório.
   */
  tempoDaProva: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState(
    convidarPorEmail.bind(null, jobId),
    {} as EstadoDoConvite,
  );
  const router = useRouter();
  const painelDoAcesso = useRef<HTMLDivElement>(null);

  const acesso = estado.acesso;

  // Quando o resultado chega, o botão que tinha o foco deixa de existir e o
  // foco cai no <body> — o diálogo perde a navegação por teclado e o leitor de
  // tela não anuncia nada. Mover o foco para o painel do acesso resolve as duas
  // coisas e ainda é o lugar certo: é o que a pessoa veio buscar.
  useEffect(() => {
    if (acesso) painelDoAcesso.current?.focus();
  }, [acesso]);

  function aoMudarAbertura(proximo: boolean) {
    setAberto(proximo);
    // Atualiza a lista de candidatos só ao FECHAR: revalidar com o diálogo
    // aberto troca a árvore por baixo dele e o resultado nunca aparece.
    if (!proximo && estado.ok) router.refresh();
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <UserPlus className="size-3.5" />
            Cadastrar candidato
          </Button>
        }
      />
      {/* `lg` e não `md`: a linha do código passou a ter duas saídas ("copiar
          mensagem" e "só o código") e, na largura anterior, elas empurravam os
          quatro dígitos para uma segunda linha. */}
      <DialogContent className="sm:max-w-lg">
        {/* O cabeçalho conta o passo em que a pessoa ESTÁ. Manter o texto do
            cadastro depois de cadastrar deixava duas frases dizendo coisas
            diferentes na mesma tela. */}
        <DialogHeader>
          <DialogTitle>
            {acesso ? `Acesso de ${estado.candidato}` : "Cadastrar candidato"}
          </DialogTitle>
          <DialogDescription>
            {acesso
              ? estado.enviado
                ? estado.mensagem
                : "Escolha por onde entregar. As três formas abrem a mesma prova."
              : "Depois de cadastrar, você escolhe como entregar o acesso: link, QR Code ou código de 4 dígitos."}
          </DialogDescription>
        </DialogHeader>

        {!acesso ? (
          <form action={acao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convite-nome">Nome do candidato</Label>
              <Input
                id="convite-nome"
                name="nome"
                required
                autoComplete="off"
                aria-invalid={Boolean(estado.campos?.nome)}
                aria-describedby={
                  estado.campos?.nome ? "convite-nome-erro" : undefined
                }
              />
              {estado.campos?.nome && (
                <p id="convite-nome-erro" className="text-xs text-destructive">
                  {estado.campos.nome}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="convite-email">E-mail</Label>
              <Input
                id="convite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                aria-invalid={Boolean(estado.campos?.email)}
                aria-describedby={
                  estado.campos?.email ? "convite-email-erro" : undefined
                }
              />
              {estado.campos?.email && (
                <p id="convite-email-erro" className="text-xs text-destructive">
                  {estado.campos.email}
                </p>
              )}
            </div>

            {estado.erro && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {estado.erro}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => aoMudarAbertura(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={pendente} className="gap-1.5">
                {pendente && <Loader2 className="size-3.5 animate-spin" />}
                {pendente ? "Cadastrando" : "Cadastrar e gerar acesso"}
              </Button>
            </div>
          </form>
        ) : (
          <div
            ref={painelDoAcesso}
            tabIndex={-1}
            className="space-y-4 outline-none"
          >
            {/* Sem servidor de e-mail o aviso é informação de estado, não um
                erro — mas precisa aparecer antes das opções, porque é ele que
                explica por que elas estão ali. */}
            {!estado.enviado && (
              <p className="rounded-lg border border-dashed px-3 py-2 t-legenda leading-relaxed text-muted-foreground">
                {estado.mensagem}
              </p>
            )}

            {/* Cada via é uma linha com a mesma anatomia: rótulo à esquerda,
                conteúdo à direita. Antes o QR e o código tinham cada um a sua
                estrutura, e a lista parecia três coisas soltas. */}
            <ul className="divide-y rounded-lg border">
              <li className="flex items-center gap-3 p-3">
                <span className="etiqueta w-16 shrink-0">Link</span>
                <code
                  className="leitura min-w-0 flex-1 truncate t-legenda text-muted-foreground"
                  title={acesso.link}
                >
                  {acesso.link}
                </code>
                <BotaoCopiar
                  texto={acesso.link}
                  confirmacao="Link copiado"
                  className="shrink-0"
                  rotuloAcessivel="Copiar o link pessoal do candidato"
                >
                  Copiar
                </BotaoCopiar>
              </li>

              <li className="flex items-center gap-3 p-3">
                <span className="etiqueta w-16 shrink-0">QR Code</span>
                <div className="min-w-0 flex-1">
                  {acesso.qrDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={acesso.qrDataUrl}
                      alt={`QR Code de acesso de ${estado.candidato}`}
                      className="size-20 rounded-md border bg-white p-1"
                    />
                  ) : (
                    /* O QR é desenhado no servidor junto com o link, então não
                       existe estado "gerando". Se não veio, não vem — e dizer o
                       que fazer no lugar é mais útil que um rótulo eterno. */
                    <p className="t-legenda leading-relaxed text-muted-foreground">
                      Não foi possível gerar o QR Code. Use o link ou o código —
                      abrem a mesma prova.
                    </p>
                  )}
                </div>
                {acesso.qrDataUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 gap-1.5"
                    nativeButton={false}
                    render={
                      <a
                        href={acesso.qrDataUrl}
                        download={`acesso-${(estado.candidato ?? "candidato")
                          .toLowerCase()
                          .replace(/\s+/g, "-")}.png`}
                      />
                    }
                  >
                    <QrCode className="size-3.5" />
                    Baixar
                  </Button>
                )}
              </li>

              <li className="p-3">
                {acesso.codigo ? (
                  <CodigoDeAcesso
                    codigo={acesso.codigo}
                    baseDoSite={baseDoSite}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="etiqueta w-16 shrink-0">Código</span>
                    <p className="t-legenda text-muted-foreground">
                      Indisponível — use o link ou o QR.
                    </p>
                  </div>
                )}
              </li>
            </ul>

            {/* Uma ação principal e uma secundária, lado a lado. Dois botões
                de largura total empilhados disputavam a mesma importância. */}
            <div className="flex justify-end gap-2">
              {!estado.enviado && (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        `${tituloDaVaga} — mapeamento comportamental`,
                      )}&body=${encodeURIComponent(
                        `Olá!\n\nPara seguir no processo da vaga de ${tituloDaVaga}, responda o mapeamento comportamental (leva ${tempoDaProva}):\n\n${acesso.link}\n\n${
                          acesso.codigo
                            ? `Se preferir: ${mensagemDeAcesso(baseDoSite, acesso.codigo)}.\n\n`
                            : ""
                        }Obrigado!`,
                      )}`}
                    />
                  }
                >
                  Abrir no meu e-mail
                </Button>
              )}

              <Button size="sm" onClick={() => aoMudarAbertura(false)}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
